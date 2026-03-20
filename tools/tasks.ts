#!/usr/bin/env -S deno run -A
if (Deno.args[0] === "install-hooks") {
  const src = ".githooks/pre-commit";
  const dst = ".git/hooks/pre-commit";
  await Deno.mkdir(".git/hooks", { recursive: true });
  await Deno.copyFile(src, dst);

  // Only set permissions on Unix-like systems (chmod not supported on Windows)
  if (Deno.build.os !== "windows") {
    try {
      await Deno.chmod(dst, 0o755);
    } catch (error) {
      console.warn("Warning: Could not set execute permissions:", error.message);
    }
  }

  console.log("Installed pre-commit hook.");
  if (Deno.build.os === "windows") {
    console.log("Note: On Windows, git hooks should work without explicit chmod.");
  }
} else {
  console.log("Usage: deno run -A tools/tasks.ts install-hooks");
}
