import 'package:bloc/bloc.dart';
import 'package:flutter/cupertino.dart';
import 'package:frontend/features/authentication/signUp/Ui/bloc/sign_up_state.dart';
import 'package:get/get.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:meta/meta.dart';

part 'sign_up_event.dart';
//part 'sign_up_state.dart';

// class SignUpBloc extends Bloc<SignUpEvent, SignUpState> {
//   SignUpBloc() : super(SignUpInitial()) {
//     on<SignUpEvent>((event, emit) {
//       // TODO: implement event handler
//     });
//   }
// }

// Bloc Implementation
class SignUpBloc extends Bloc<SignUpEvent, SignUpState> {
  SignUpBloc() : super(SignUpState());

  void dispose() {
    // Clean up resources
  }

  @override
  Stream<SignUpState> mapEventToState(SignUpEvent event) async* {
    if (event is FirstNameChanged) {
      yield state.copyWith(firstName: event.firstName);
    } else if (event is LastNameChanged) {
      yield state.copyWith(lastName: event.lastName);
    }
    // Handle other events...

    else if (event is SignUpSubmitted) {
      yield state.copyWith(isSubmitting: true);
      try {
        // Perform signup logic
        await Future.delayed(Duration(seconds: 2)); // Simulate network call
        yield state.copyWith(isSubmitting: false);
        Get.to(() => const VerifyEmail());
      } catch (e) {
        yield state.copyWith(isSubmitting: false, error: e.toString());
      }
    }
  }
}



class VerifyEmail extends StatelessWidget {
  const VerifyEmail({super.key});

  @override
  Widget build(BuildContext context) {
    return const Placeholder();
  }
}


