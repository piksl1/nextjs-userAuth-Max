"use server";

import { createAuthSession, destroySession } from "@/lib/auth";
import { hashUserPassword, verifyPassword } from "@/lib/hash";
import { createUser, getUserByEmail } from "@/lib/user";

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
    const userId = await createUser(email, hashedPassword);

    if (!userId) {
      throw new Error("Failed to create user");
    }

    await createAuthSession(userId);

    return {
      success: true,
      redirectTo: "/training",
    };
  } catch (error) {
    console.error("Signup error:", error);

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

export async function login(prevState, formData) {
  const email = formData.get("email");
  const password = formData.get("password");

  const existingUser = getUserByEmail(email);

  if (!existingUser) {
    return {
      errors: {
        email: "Could not authenticate user, please check your credentials",
      },
    };
  }
  const isValidPassword = verifyPassword(existingUser.password, password);

  if (!isValidPassword) {
    return {
      errors: {
        password: "Could not authenticate user, please check your credentials",
      },
    };
  }

  await createAuthSession(existingUser.id);

  return {
    success: true,
    redirectTo: "/training",
  };
}

export async function auth(mode,prevState, formData) {
  if(mode === 'login'){
    return login(prevState, formData);
  }
  return signup(prevState, formData);
}

export async function logout() {
  await destroySession();
  return {
    success: true,
    redirectTo: "/",
  };
}