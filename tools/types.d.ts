// Type definitions for Deno in this project
declare global {
  const Deno: {
    args: string[];
    readDir: (
      path: string,
    ) => AsyncIterableIterator<{ name: string; isFile: boolean; isDirectory: boolean }>;
    readTextFile: (path: string) => Promise<string>;
    writeTextFile: (path: string, data: string) => Promise<void>;
    mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    stat: (path: string) => Promise<any>;
    Command: new (
      command: string,
      options?: {
        args?: string[];
        stdin?: string;
        stdout?: string;
        stderr?: string;
      },
    ) => {
      output(): Promise<{ code: number }>;
    };
    exit: (code: number) => never;
    errors: {
      AlreadyExists: new () => Error;
    };
  };

  interface ImportMeta {
    main: boolean;
  }
}

export {};
