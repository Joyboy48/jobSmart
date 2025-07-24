import 'package:bloc/bloc.dart';
import 'package:meta/meta.dart';

import 'login_state.dart';

part 'login_event.dart';
// part 'login_state.dart';

// class LoginBloc extends Bloc<LoginEvent, LoginState> {
//   LoginBloc() : super(LoginInitial()) {
//     on<LoginEvent>((event, emit) {
//       // TODO: implement event handler
//     });
//   }
// }

// login_bloc.dart


class LoginBloc extends Bloc<LoginEvent, LoginState> {
  LoginBloc() : super(LoginState()) {
    on<LoginEmailChanged>(_onEmailChanged);
    on<LoginPasswordChanged>(_onPasswordChanged);
    on<LoginSubmitted>(_onSubmitted);
    on<LoginWithGoogle>(_onGoogleLogin);
    on<LoginWithFacebook>(_onFacebookLogin);
  }

  void _onEmailChanged(LoginEmailChanged event, Emitter<LoginState> emit) {
    emit(state.copyWith(email: event.email));
  }

  void _onPasswordChanged(LoginPasswordChanged event, Emitter<LoginState> emit) {
    emit(state.copyWith(password: event.password));
  }

  Future<void> _onSubmitted(LoginSubmitted event, Emitter<LoginState> emit) async {
    try {
      emit(state.copyWith(isLoading: true, error: null));
      // Implement your login logic here
      // await authRepository.login(event.email, event.password);
      emit(state.copyWith(isLoading: false));
      // Navigate to next screen using navigator or Get
    } catch (e) {
      emit(state.copyWith(isLoading: false, error: e.toString()));
    }
  }

  Future<void> _onGoogleLogin(LoginWithGoogle event, Emitter<LoginState> emit) async {
    try {
      emit(state.copyWith(isLoading: true, error: null));
      // Implement Google login logic
      emit(state.copyWith(isLoading: false));
    } catch (e) {
      emit(state.copyWith(isLoading: false, error: e.toString()));
    }
  }

  Future<void> _onFacebookLogin(LoginWithFacebook event, Emitter<LoginState> emit) async {
    try {
      emit(state.copyWith(isLoading: true, error: null));
      // Implement Facebook login logic
      emit(state.copyWith(isLoading: false));
    } catch (e) {
      emit(state.copyWith(isLoading: false, error: e.toString()));
    }
  }
}
