class HttpException extends Error {
    constructor(status, message, baseError) {
      super(message);
  
      this.status = status;
      this.error = baseError;
    }
  
    log() {
      return (this.error || this).toString();
    }
  }
  
  class NotFoundException extends HttpException {
    constructor(message, error) {
      super(404, message, error);
    }
  }
  
  class BadRequestException extends HttpException {
    constructor(message, error, data) {
      super(400, message, error);
  
      this.data = data;
    }
  }
  
  class InternalException extends HttpException {
    constructor(message, error) {
      super(500, message, error);
    }
  }
  
  class ConflictException extends HttpException {
    constructor(message, error) {
      super(409, message, error);
    }
  }
  
  class UnauthorizedException extends HttpException {
    constructor(message, error) {
      super(401, message, error);
    }
  }
  
  module.exports = {
    BadRequestException,
    InternalException,
    NotFoundException,
    ConflictException,
    UnauthorizedException,
  };