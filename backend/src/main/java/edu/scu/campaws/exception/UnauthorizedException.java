package edu.scu.campaws.exception;

/** No valid login on the request. Becomes a 401. */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
