part of 'login_bloc.dart';

@immutable
sealed class LoginEvent {}

// login_event.dart


class LoginEmailChanged extends LoginEvent {
  final String email;
  LoginEmailChanged(this.email);
}

class LoginPasswordChanged extends LoginEvent {
  final String password;
  LoginPasswordChanged(this.password);
}

class LoginSubmitted extends LoginEvent {
  final String email;
  final String password;
  LoginSubmitted({required this.email, required this.password});
}

class LoginWithGoogle extends LoginEvent {}

class LoginWithFacebook extends LoginEvent {}
