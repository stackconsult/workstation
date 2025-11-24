/**
 * Training Module System
 * Provides interactive lessons and tutorials for workspace automation
 * Phase 11: Training Component
 */

import { logger } from "../../utils/logger";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: "email" | "file" | "rss" | "template" | "workflow" | "advanced";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number; // in minutes
  prerequisites: string[]; // lesson IDs
  objectives: string[];
  content: LessonContent;
  exercises: Exercise[];
  resources: Resource[];
}

export interface LessonContent {
  sections: Array<{
    title: string;
    content: string;
    codeExamples?: CodeExample[];
    tips?: string[];
  }>;
}

export interface CodeExample {
  title: string;
  code: string;
  language: string;
  explanation: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  task: string;
  hints: string[];
  solution: ExerciseSolution;
  validation: ValidationFunction;
}

export interface ExerciseSolution {
  code: string;
  explanation: string;
}

export type ValidationFunction = (
  userCode: string,
  result: unknown,
) => ValidationResult;

export interface ValidationResult {
  passed: boolean;
  feedback: string;
  errors?: string[];
}

export interface Resource {
  type: "video" | "documentation" | "article" | "example";
  title: string;
  url: string;
  duration?: number; // for videos, in minutes
}

export interface UserProgress {
  userId: string;
  completedLessons: string[];
  inProgressLessons: Map<string, number>; // lessonId -> progress percentage
  exerciseScores: Map<string, number>; // exerciseId -> score (0-100)
  achievements: Achievement[];
  skillLevels: Map<string, SkillLevel>; // category -> skill level
  totalTimeSpent: number; // in minutes
  lastActivityDate: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: Date;
}

export interface SkillLevel {
  category: string;
  level: "novice" | "beginner" | "intermediate" | "advanced" | "expert";
  score: number; // 0-100
  lessonsCompleted: number;
  exercisesCompleted: number;
}

/**
 * Training Module Manager
 */
export class TrainingModule {
  private lessons: Map<string, Lesson> = new Map();
  private userProgress: Map<string, UserProgress> = new Map();
  private achievements: Map<string, Achievement> = new Map();

  constructor() {
    this.registerDefaultLessons();
    this.registerAchievements();
  }

  /**
   * Register default lessons
   */
  private registerDefaultLessons(): void {
    // Implementation truncated for brevity - see full implementation
    logger.info("Default lessons registered", { count: this.lessons.size });
  }

  /**
   * Register achievements
   */
  private registerAchievements(): void {
    this.achievements.set("first-lesson", {
      id: "first-lesson",
      title: "Getting Started",
      description: "Complete your first lesson",
      icon: "🎓",
      earnedDate: new Date(),
    });
  }

  /**
   * Register a lesson
   */
  registerLesson(lesson: Lesson): void {
    this.lessons.set(lesson.id, lesson);
    logger.info("Lesson registered", { id: lesson.id, title: lesson.title });
  }

  /**
   * Get lesson by ID
   */
  getLesson(id: string): Lesson | null {
    return this.lessons.get(id) || null;
  }

  /**
   * Get lessons by category
   */
  getLessonsByCategory(category: string): Lesson[] {
    return Array.from(this.lessons.values()).filter(
      (l) => l.category === category,
    );
  }

  /**
   * Get all lessons
   */
  getAllLessons(): Lesson[] {
    return Array.from(this.lessons.values());
  }

  /**
   * Get user progress
   */
  getUserProgress(userId: string): UserProgress {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        userId,
        completedLessons: [],
        inProgressLessons: new Map(),
        exerciseScores: new Map(),
        achievements: [],
        skillLevels: new Map(),
        totalTimeSpent: 0,
        lastActivityDate: new Date(),
      });
    }
    return this.userProgress.get(userId)!;
  }

  /**
   * Mark lesson as completed
   */
  completeLesson(userId: string, lessonId: string, timeSpent: number): void {
    const progress = this.getUserProgress(userId);

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.totalTimeSpent += timeSpent;
      progress.lastActivityDate = new Date();

      logger.info("Lesson completed", { userId, lessonId, timeSpent });
    }
  }

  /**
   * Update exercise score
   */
  updateExerciseScore(userId: string, exerciseId: string, score: number): void {
    const progress = this.getUserProgress(userId);
    progress.exerciseScores.set(exerciseId, score);
    progress.lastActivityDate = new Date();

    logger.info("Exercise scored", { userId, exerciseId, score });
  }
}

// Singleton instance
export const trainingModule = new TrainingModule();
