import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'features/authentication/login/UI/screen/login.dart';
import 'features/authentication/signUp/Ui/bloc/sign_up_bloc.dart';
import 'features/authentication/signUp/Ui/screen/signUp.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return  MultiProvider(
      providers: [
        Provider<SignUpBloc>(
          create: (_) => SignUpBloc(),
          dispose: (_, bloc) => bloc.dispose(),
        ),
      ],
      child: MaterialApp(
        home: SignUpView(),
      ),
    );
  }
}

