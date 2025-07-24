// part of 'sign_up_bloc.dart';
//
// @immutable
// sealed class SignUpState {}
//
// final class SignUpInitial extends SignUpState {}
// Bloc State
class SignUpState {
  final String firstName;
  final String lastName;
  // Add more fields...

  final bool isSubmitting;
  final String? error;

  SignUpState({
    this.firstName = '',
    this.lastName = '',
    // Initialize other fields...
    this.isSubmitting = false,
    this.error,
  });

  SignUpState copyWith({
    String? firstName,
    String? lastName,
    // Add more fields...
    bool? isSubmitting,
    String? error,
  }) {
    return SignUpState(
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      // Copy other fields...
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: error,
    );
  }
}
