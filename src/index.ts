import { Elysia } from "elysia";
import { ErrorHandler } from "./presentation/plugin/ErrorHandler";
import { Router } from "./presentation/Router";
import { container } from "./injection/Container";

const start = async () => {
  try {
    await container.initialize();

    const app = new Elysia().use(ErrorHandler).use(Router.setup()).listen(3000);

    console.log(
      `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
    );
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
};

start();
