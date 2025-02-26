import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import { AuthContext } from "../../auth";
import { useForm } from "react-hook-form";

export default function Signup() {
  const { fetchWithCSRF, setCurrentUserId } = useContext(AuthContext);
  let history = useHistory();

  const {
    register,
    errors,
    setError,
    getValues,
    clearErrors,
    handleSubmit,
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  async function signupUser(data) {
    const response = await fetchWithCSRF("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    if (!response.ok) {
      // setErrors(responseData.errors);
    } else {
      // setOpen(false);
      setCurrentUserId(responseData.current_user_id);
      history.replace('/')
    }
  }

  const validate_password = () => {
    const { password, confirm_password } = getValues([
      "password",
      "confirm_password",
    ]);
    if (password !== confirm_password) {
      setError("password", {
        type: "no_match",
        message: "Passwords must match",
      });
      return false;
    } else if (password !== "") {
      clearErrors(["password", "confirm_password"]);
      return true;
    }
	};

  return (
    <div className="content-cont">
      <div className="auth__cont">
        <form onSubmit={handleSubmit(signupUser)}>
          <div className="add-loc__cont-inner">
            <div className="add-loc__el add-loc__el-col">
              <label className="add-loc__label" htmlFor="username">
                Username
              </label>
              {errors.username?.type === "required" && (
                <div className="add-loc__err">Please enter a username</div>
              )}
              {errors.username?.type === "minLength" && (
                <div className="add-loc__err">
                  Username must be at least 4 characters
                </div>
              )}
              {errors.username?.type === "maxLength" && (
                <div className="add-loc__err">
                  Username must be no more than 50 characters
                </div>
              )}
              {errors.username?.type === "pattern" && (
                <div className="add-loc__err">
                  Username can only contain letters, numbers, and underscores
                </div>
              )}
              <input
                ref={register({
                  required: true,
                  minLength: 4,
									maxLength: 50,
									pattern: /^[a-zA-Z0-9_]+$/,
								})}
								// pattern="[A-Za-z0-9_]+"
                name="username"
                placeholder="Username"
              />
            </div>
            <div className="add-loc__el add-loc__el-col">
              <label className="add-loc__label" htmlFor="email">
                Email
              </label>
              {errors.email?.type === "required" && (
                <div className="add-loc__err">Please enter an email</div>
              )}
              {errors.email?.type === "maxLength" && (
                <div className="add-loc__err">
                  Email must be no more than 100 characters
                </div>
              )}
              {errors.email?.type === "pattern" && (
                <div className="add-loc__err">Please enter a valid email</div>
              )}
              <input
                ref={register({
                  required: true,
                  pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  maxLength: 100,
                })}
                name="email"
                placeholder="Email"
              />
            </div>
            <div className="add-loc__el add-loc__el-col">
              <label className="add-loc__label" htmlFor="password">
                Password
              </label>
              {errors.password?.type === "required" && (
                <div className="add-loc__err">Please enter a password</div>
              )}
              {errors.password?.type === "minLength" && (
                <div className="add-loc__err">
                  Password must be at least 4 characters
                </div>
              )}
              {errors.password?.type === "maxLength" && (
                <div className="add-loc__err">
                  Password must be no more than 50 characters
                </div>
              )}
              {errors.confirm_password?.type === "required" &&
                !errors.password?.type === "required" && (
                  <div className="add-loc__err">
                    Please confirm your password
                  </div>
                )}
              {(errors.confirm_password?.type === "validate" ||
                errors.password?.type === "validate") && (
                <div className="add-loc__err">Passwords must match</div>
              )}
              <input
                ref={register({
                  required: true,
                  minLength: 4,
                  maxLength: 50,
                  validate: () => validate_password(),
                })}
                onChange={validate_password}
                name="password"
                placeholder="Password"
                type="password"
              />
              <input
                ref={register({
                  required: true,
                  validate: () => validate_password(),
                })}
                onChange={validate_password}
                name="confirm_password"
                placeholder="Confirm Password"
                type="password"
                id="confirm-password"
              />
            </div>
            <div className="add-loc__btn-cont">
              <button className="btn add-loc__btn">Sign Up</button>
            </div>
            <div className="existing-user__cont">
              <div>Already have an account?</div>
              <div
                className="existing-user__link"
                onClick={() => history.push("/login")}
              >
                Log in!
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
