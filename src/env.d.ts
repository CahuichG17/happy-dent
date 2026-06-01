/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
      doctorId: number | null;
      image?: string | null;
    };
    session?: {
      id: string;
      userId: string;
      expiresAt: Date;
    };
  }
}
