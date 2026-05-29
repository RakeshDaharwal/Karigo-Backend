import { ZodType } from "zod";
import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger.utils";

export const validate =
  <T>(
    schema: ZodType<T>,
    eventName: string,
    service: string
  ) =>
    (req: Request, res: Response, next: NextFunction) => {

      console.log('result', req.body)

      const result = schema.safeParse(req.body);

      if (!result.success) {
        logError("Validation failed", {
          service,
          event: eventName,
          email: req.body?.email,
          mobile: req.body?.mobile,
          path: req.path,
          error: result.error.issues[0].message,
        });

        return res.status(400).json({
          success: false,
          statusCode: 400,
          message: result.error.issues[0].message,
        });
      }

      req.body = result.data;
      next();
    };