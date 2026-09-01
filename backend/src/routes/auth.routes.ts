import { Router } from "express";

import {
  createUser,
  verifyUser,
} from "../services/auth.service.js";

import {
  createToken,
} from "../services/token.service.js";

const router = Router();

function isValidEmail(
  email: string
): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

// POST /auth/signup
router.post(
  "/signup",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          error:
            "Email and password are required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      if (
        !isValidEmail(normalizedEmail)
      ) {
        return res.status(400).json({
          error:
            "Please provide a valid email address",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error:
            "Password must be at least 8 characters",
        });
      }

      const user =
        await createUser(
          normalizedEmail,
          password
        );

      const token =
        createToken(user.id);

      return res.status(201).json({
        user,
        token,
      });
    } catch (error) {
      return res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Signup failed",
      });
    }
  }
);

// POST /auth/login
router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      if (
        typeof email !== "string" ||
        typeof password !== "string"
      ) {
        return res.status(400).json({
          error:
            "Email and password are required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      if (
        !isValidEmail(normalizedEmail)
      ) {
        return res.status(400).json({
          error:
            "Please provide a valid email address",
        });
      }

      const user =
        await verifyUser(
          normalizedEmail,
          password
        );

      if (!user) {
        return res.status(401).json({
          error:
            "Invalid email or password",
        });
      }

      const token =
        createToken(user.id);

      return res.json({
        user,
        token,
      });
    } catch {
      return res.status(500).json({
        error: "Login failed",
      });
    }
  }
);

export default router;