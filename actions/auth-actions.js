"use server";

import { hashUserPassword } from "@/lib/hash";
import { createUser } from "@/lib/user";
import { redirect } from "next/navigation";

export async function signup(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  let errors = {};

  if (!email?.includes("@")) {
    errors.email = "Please enter a valid email address";
  }

  if (!password || password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  }

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      message: "Validation failed",
    };
  }

  const hashedPassword = hashUserPassword(password);

  try {
    createUser(email, hashedPassword);
    return {
      message: "User created successfully",
    };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return {
        errors: {
          email:
            "It seems like an account for the chosen email already exists.",
        },
        message: "Registration failed",
      };
    }
    return {
      errors: {
        general: "Something went wrong. Please try again later.",
      },
      message: "Registration failed",
    };
  }
}
