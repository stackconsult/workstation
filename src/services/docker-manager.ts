import Docker from "dockerode";
import { logger } from "../utils/logger";

/**
 * Docker Manager Service
 *
 * Manages Docker containers for MCP (Model Context Protocol) agents
 * Provides lifecycle management, health monitoring, and communication
 *
 * Phase 2: MCP Container Integration
 */

interface ContainerInfo {
  id: string;
  name: string;
  status: string;
  state: string;
  image: string;
  ports: any[];
  created: Date;
}

interface ContainerStats {
  cpu_percent: number;
  memory_usage: number;
  memory_limit: number;
  network_rx: number;
  network_tx: number;
}

class DockerManager {
  private docker: Docker;
  private containers: Map<string, Docker.Container>;

  constructor() {
    // Initialize Docker client
    // Uses Docker socket by default (/var/run/docker.sock)
    this.docker = new Docker();
    this.containers = new Map();

    logger.info("Docker Manager initialized");
  }

  /**
   * List all containers (running and stopped)
   */
  async listContainers(all: boolean = false): Promise<ContainerInfo[]> {
    try {
      const containers = await this.docker.listContainers({ all });

      return containers.map((container) => ({
        id: container.Id,
        name: container.Names[0]?.replace("/", "") || "unknown",
        status: container.Status,
        state: container.State,
        image: container.Image,
        ports: container.Ports,
        created: new Date(container.Created * 1000),
      }));
    } catch (error) {
      logger.error("Error listing containers", { error });
      throw error;
    }
  }

  /**
   * Start a container by name or ID
   */
  async startContainer(nameOrId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.start();
      this.containers.set(nameOrId, container);

      logger.info("Container started", { container: nameOrId });
    } catch (error) {
      logger.error("Error starting container", { container: nameOrId, error });
      throw error;
    }
  }

  /**
   * Stop a container by name or ID
   */
  async stopContainer(nameOrId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.stop();
      this.containers.delete(nameOrId);

      logger.info("Container stopped", { container: nameOrId });
    } catch (error) {
      logger.error("Error stopping container", { container: nameOrId, error });
      throw error;
    }
  }

  /**
   * Restart a container by name or ID
   */
  async restartContainer(nameOrId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.restart();

      logger.info("Container restarted", { container: nameOrId });
    } catch (error) {
      logger.error("Error restarting container", {
        container: nameOrId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get container stats (CPU, memory, network)
   */
  async getContainerStats(nameOrId: string): Promise<ContainerStats> {
    try {
      const container = this.docker.getContainer(nameOrId);
      const stats = await container.stats({ stream: false });

      // Calculate CPU percentage
      const cpuDelta =
        stats.cpu_stats.cpu_usage.total_usage -
        stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta =
        stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercent =
        (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100;

      // Get memory usage
      const memoryUsage = stats.memory_stats.usage;
      const memoryLimit = stats.memory_stats.limit;

      // Get network I/O
      const networks = stats.networks || {};
      let networkRx = 0;
      let networkTx = 0;
      Object.values(networks).forEach((net: any) => {
        networkRx += net.rx_bytes || 0;
        networkTx += net.tx_bytes || 0;
      });

      return {
        cpu_percent: cpuPercent || 0,
        memory_usage: memoryUsage || 0,
        memory_limit: memoryLimit || 0,
        network_rx: networkRx,
        network_tx: networkTx,
      };
    } catch (error) {
      logger.error("Error getting container stats", {
        container: nameOrId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get container logs
   */
  async getContainerLogs(
    nameOrId: string,
    tail: number = 100,
  ): Promise<string> {
    try {
      const container = this.docker.getContainer(nameOrId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail,
        timestamps: true,
      });

      return logs.toString();
    } catch (error) {
      logger.error("Error getting container logs", {
        container: nameOrId,
        error,
      });
      throw error;
    }
  }

  /**
   * Execute command in container
   */
  async execInContainer(nameOrId: string, cmd: string[]): Promise<string> {
    try {
      const container = this.docker.getContainer(nameOrId);
      const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: true, stdin: false });

      return new Promise((resolve, reject) => {
        let output = "";
        stream.on("data", (chunk) => {
          output += chunk.toString();
        });
        stream.on("end", () => resolve(output));
        stream.on("error", reject);
      });
    } catch (error) {
      logger.error("Error executing command in container", {
        container: nameOrId,
        cmd,
        error,
      });
      throw error;
    }
  }

  /**
   * Check if Docker daemon is running
   */
  async checkDockerHealth(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      logger.error("Docker daemon not accessible", { error });
      return false;
    }
  }

  /**
   * Pull Docker image
   */
  async pullImage(imageName: string): Promise<void> {
    try {
      logger.info("Pulling Docker image", { image: imageName });

      await new Promise((resolve, reject) => {
        this.docker.pull(imageName, (err: any, stream: any) => {
          if (err) return reject(err);

          this.docker.modem.followProgress(stream, (err: any, output: any) => {
            if (err) return reject(err);
            resolve(output);
          });
        });
      });

      logger.info("Docker image pulled successfully", { image: imageName });
    } catch (error) {
      logger.error("Error pulling Docker image", { image: imageName, error });
      throw error;
    }
  }

  /**
   * Create and start a new container
   */
  async createContainer(options: {
    name: string;
    image: string;
    env?: string[];
    ports?: { [key: string]: [{ HostPort: string }] };
    volumes?: string[];
  }): Promise<string> {
    try {
      const container = await this.docker.createContainer({
        name: options.name,
        Image: options.image,
        Env: options.env || [],
        ExposedPorts: options.ports
          ? Object.keys(options.ports).reduce((acc, port) => {
              acc[port] = {};
              return acc;
            }, {} as any)
          : undefined,
        HostConfig: {
          PortBindings: options.ports,
          Binds: options.volumes,
        },
      });

      await container.start();
      this.containers.set(container.id, container);

      logger.info("Container created and started", {
        id: container.id,
        name: options.name,
      });
      return container.id;
    } catch (error) {
      logger.error("Error creating container", { options, error });
      throw error;
    }
  }

  /**
   * Remove a container
   */
  async removeContainer(
    nameOrId: string,
    force: boolean = false,
  ): Promise<void> {
    try {
      const container = this.docker.getContainer(nameOrId);
      await container.remove({ force });
      this.containers.delete(nameOrId);

      logger.info("Container removed", { container: nameOrId, force });
    } catch (error) {
      logger.error("Error removing container", { container: nameOrId, error });
      throw error;
    }
  }
}

// Singleton instance
export const dockerManager = new DockerManager();
