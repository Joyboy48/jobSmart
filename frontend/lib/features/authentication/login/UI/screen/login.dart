// login_page.dart
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:get/get_core/src/get_main.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../../Utiles/Helpers/helper_functions.dart';
import '../../../../../Utiles/constants/colors.dart';
import '../../../../../Utiles/constants/image_strings.dart';
import '../../../../../Utiles/constants/size.dart';
import '../../../../../Utiles/constants/texts_strings.dart';
import '../bloc/login_bloc.dart';
import '../bloc/login_state.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => LoginBloc(),
      child: const LoginView(),
    );
  }
}

class LoginView extends StatelessWidget {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = HelperFunctions.isDarkMode(context);
    return BlocConsumer<LoginBloc, LoginState>(
      listener: (context, state) {
        if (state.error != null) {
          // Show error message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error!)),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          body: SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.only(top: kToolbarHeight),
              child: Column(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Image(
                      //   height: 150,
                      //   image: AssetImage(dark
                      //       ? ImageStrings.lightAppLogo
                      //       : ImageStrings.darkAppLogo),
                      // ),
                      Text(
                        "Welcome back,",
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      Text(
                        "Discover Limitless Choice and Unmatched Convenience.",
                        style: Theme.of(context).textTheme.bodyMedium,
                      )
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        vertical: MySize.spaceBtwSection),
                    child: Form(
                      child: Column(
                        children: [
                          TextFormField(
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Iconsax.direct_right),
                              labelText: TextsStrings.email,
                            ),
                            onChanged: (value) => context
                                .read<LoginBloc>()
                                .add(LoginEmailChanged(value)),
                          ),
                          const SizedBox(height: MySize.spaceBtwInputField),
                          TextFormField(
                            decoration: const InputDecoration(
                              prefixIcon: Icon(Iconsax.password_check),
                              labelText: TextsStrings.password,
                              suffixIcon: Icon(Iconsax.eye_slash),
                            ),
                            onChanged: (value) => context
                                .read<LoginBloc>()
                                .add(LoginPasswordChanged(value)),
                          ),
                          const SizedBox(height: MySize.spaceBtwInputField / 2),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Checkbox(
                                    value: state.rememberMe,
                                    onChanged: (value) {},
                                  ),
                                  const Text(TextsStrings.rememberMe)
                                ],
                              ),
                              TextButton(
                                onPressed: () =>
                                    Get.to(() => const ForgetPassword()),
                                child: const Text(TextsStrings.forgetPassword),
                              )
                            ],
                          ),
                          const SizedBox(height: MySize.spaceBtwSection),
                          if (state.isLoading)
                            const CircularProgressIndicator()
                          else
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () {
                                  context.read<LoginBloc>().add(
                                    LoginSubmitted(
                                      email: state.email,
                                      password: state.password,
                                    ),
                                  );
                                },
                                child: const Text(TextsStrings.signIn),
                              ),
                            ),
                          const SizedBox(height: MySize.spaceBtwItems),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: () => Get.to(() => const signUpPage()),
                              child: const Text(TextsStrings.createAccount),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Flexible(
                        child: Divider(
                          color: dark ? MyColors.darkGrey : MyColors.grey,
                          thickness: 0.5,
                          indent: 60,
                          endIndent: 5,
                        ),
                      ),
                      Text(
                        TextsStrings.orSignInWith.capitalize!,
                        style: Theme.of(context).textTheme.labelMedium,
                      ),
                      Flexible(
                        child: Divider(
                          color: dark ? MyColors.darkGrey : MyColors.grey,
                          thickness: 0.5,
                          indent: 5,
                          endIndent: 60,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: MySize.spaceBtwItems),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: MyColors.grey),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        // child: IconButton(
                        //   onPressed: () => context
                        //       .read<LoginBloc>()
                        //       .add(LoginWithGoogle()),
                        //   icon: const Image(
                        //     width: MySize.iconMd,
                        //     height: MySize.iconMd,
                        //     image: AssetImage(ImageStrings.lightAppLogo),
                        //   ),
                        // ),
                      ),
                      const SizedBox(width: MySize.spaceBtwItems),
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: MyColors.grey),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        // child: IconButton(
                        //   onPressed: () => context
                        //       .read<LoginBloc>()
                        //       .add(LoginWithFacebook()),
                        //   icon: const Image(
                        //     width: MySize.iconMd,
                        //     height: MySize.iconMd,
                        //     image: AssetImage(ImageStrings.lightAppLogo),
                        //   ),
                        // ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class signUpPage extends StatelessWidget {
  const signUpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}

class ForgetPassword extends StatelessWidget {
  const ForgetPassword({super.key});

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}

