/**
 * Workflow Builder API Hooks
 *
 * React hooks for interacting with workflow backend APIs.
 * Provides data fetching, caching, and state management.
 *
 * @module ui/workflow-builder/api-hooks
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from "react";

export interface UseWorkflowsResult {
  workflows: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTemplatesResult {
  templates: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseWorkflowExecutionResult {
  execute: (workflowId: string, variables?: any) => Promise<any>;
  execution: any;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for fetching workflows
 */
export function useWorkflows(ownerId?: string): UseWorkflowsResult {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = ownerId
        ? `/api/workflows?owner_id=${ownerId}`
        : "/api/workflows";

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setWorkflows(data.data || []);
      } else {
        setError(data.error || "Failed to fetch workflows");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows,
  };
}

/**
 * Hook for fetching workflow templates
 */
export function useTemplates(): UseTemplatesResult {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/workflows/templates");
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data || []);
      } else {
        setError(data.error || "Failed to fetch templates");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
  };
}

/**
 * Hook for executing workflows
 */
export function useWorkflowExecution(): UseWorkflowExecutionResult {
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (workflowId: string, variables?: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables }),
      });

      const data = await response.json();

      if (data.success) {
        setExecution(data.data);
        return data.data;
      } else {
        setError(data.error || "Failed to execute workflow");
        throw new Error(data.error);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    execute,
    execution,
    loading,
    error,
  };
}

/**
 * Hook for monitoring workflow execution
 */
export function useExecutionStatus(
  executionId: string | null,
  interval = 2000,
) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!executionId) {
      setStatus(null);
      return;
    }

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const fetchStatus = async () => {
      if (cancelled) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/workflows/executions/${executionId}`,
        );
        const data = await response.json();

        if (cancelled) return;

        if (data.success) {
          setStatus(data.data);
          setError(null);

          // Continue polling if still running
          if (
            data.data.status === "running" ||
            data.data.status === "pending"
          ) {
            timeoutId = setTimeout(fetchStatus, interval);
          }
        } else {
          setError(data.error || "Failed to fetch execution status");
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStatus();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [executionId, interval]);

  return { status, loading, error };
}

/**
 * Hook for creating workflow from template
 */
export function useCreateFromTemplate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFromTemplate = useCallback(
    async (templateId: string, name: string, variables?: any) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/workflows/templates/${templateId}/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, variables }),
          },
        );

        const data = await response.json();

        if (data.success) {
          return data.data;
        } else {
          setError(data.error || "Failed to create workflow");
          throw new Error(data.error);
        }
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { createFromTemplate, loading, error };
}

/**
 * Hook for updating workflow
 */
export function useUpdateWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWorkflow = useCallback(
    async (workflowId: string, updates: any) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        const data = await response.json();

        if (data.success) {
          return data.data;
        } else {
          setError(data.error || "Failed to update workflow");
          throw new Error(data.error);
        }
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { updateWorkflow, loading, error };
}

/**
 * Hook for deleting workflow
 */
export function useDeleteWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        setError(data.error || "Failed to delete workflow");
        throw new Error(data.error);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteWorkflow, loading, error };
}
