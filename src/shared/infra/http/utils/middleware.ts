import { authenticatedUser } from "../../../../../pact/authenticated-user";
import { IApiErrorDto } from "../dtos/api-errors.dto";
import { EApiErrorType } from "../models/api-error-types.enum";

export class Middleware {
  public isAuthenticated(mode: "NORMAL" | "TEST" = "NORMAL") {
    return async (req, res, next) => {
      if (mode === "TEST") {
        req.user = authenticatedUser;
      }
      if (req.isAuthenticated()) {
        return next();
      } else {
        const errorDto: IApiErrorDto = {
          type: EApiErrorType.USER_NOT_AUTHENTICATED,
          message: "User not authenticated",
        };
        return res.status(401).send(errorDto);
      }
    };
  }
}
