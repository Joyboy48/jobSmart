part of 'sign_up_bloc.dart';

@immutable
sealed class SignUpEvent {}
// Bloc Events


class FirstNameChanged extends SignUpEvent {
  final String firstName;

  FirstNameChanged(this.firstName);
}

class LastNameChanged extends SignUpEvent {
  final String lastName;

  LastNameChanged(this.lastName);
}

// Add more events for other form fields...

class SignUpSubmitted extends SignUpEvent {}