define(function() {

  /**
   * User.
   *
   * @constructor
   */
  function User() {
    this.passHash = null; // string
    this.passSalt = null; // string

    this.name = null; // string
  }

  return User;
});