import { Config } from 'models/cgis/errors.define';

var errors: Config[] = [
    /// Visitor Register
    /// 400 Bad Request: The request was invalid or cannot be otherwise served.
    /// An accompanying error message will explain further.
    /// For security reasons, requests without authentication are considered invalid and will yield this response.
    // ["VisitorAlreadyExists", 400, "An visitor with this key already exists."],
    // ["VisitorNotExists", 400, "An visitor with this key not exists."]
];

export default errors;