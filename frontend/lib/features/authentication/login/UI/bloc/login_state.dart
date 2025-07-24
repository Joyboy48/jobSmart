// part of 'login_bloc.dart';
//
// @immutable
// sealed class LoginState {}
//
// final class LoginInitial extends LoginState {}

// login_state.dart
class LoginState {
  final String email;
  final String password;
  final bool isLoading;
  final String? error;
  final bool rememberMe;

  LoginState({
    this.email = '',
    this.password = '',
    this.isLoading = false,
    this.error,
    this.rememberMe = false,
  });

  LoginState copyWith({
    String? email,
    String? password,
    bool? isLoading,
    String? error,
    bool? rememberMe,
  }) {
    return LoginState(
      email: email ?? this.email,
      password: password ?? this.password,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      rememberMe: rememberMe ?? this.rememberMe,
    );
  }
}
