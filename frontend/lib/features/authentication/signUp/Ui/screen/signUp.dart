// SignUpPage with Bloc
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get/get.dart';
import 'package:iconsax/iconsax.dart';

import '../../../../../Utiles/Helpers/helper_functions.dart';
import '../../../../../Utiles/constants/colors.dart';
import '../../../../../Utiles/constants/image_strings.dart';
import '../../../../../Utiles/constants/size.dart';
import '../../../../../Utiles/constants/texts_strings.dart';
import '../bloc/sign_up_bloc.dart';
import '../bloc/sign_up_state.dart';

class signUpPage extends StatelessWidget {
  const signUpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => SignUpBloc(),
      child: const SignUpView(),
    );
  }
}

class SignUpView extends StatelessWidget {
  const SignUpView({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = HelperFunctions.isDarkMode(context);
    return BlocListener<SignUpBloc, SignUpState>(
      listener: (context, state) {
        if (state.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error!)),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(MySize.defaultSpace),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  TextsStrings.signupTitle,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: MySize.spaceBtwSection),
                Form(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: BlocBuilder<SignUpBloc, SignUpState>(
                              builder: (context, state) {
                                return TextFormField(
                                  expands: false,
                                  decoration: const InputDecoration(
                                    labelText: TextsStrings.firstName,
                                    prefixIcon: Icon(Iconsax.user),
                                  ),
                                  onChanged: (value) => context.read<SignUpBloc>().add(FirstNameChanged(value)),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: MySize.spaceBtwItems),
                          Expanded(
                            child: BlocBuilder<SignUpBloc, SignUpState>(
                              builder: (context, state) {
                                return TextFormField(
                                  expands: false,
                                  decoration: const InputDecoration(
                                    labelText: TextsStrings.LastName,
                                    prefixIcon: Icon(Iconsax.user),
                                  ),
                                  onChanged: (value) => context.read<SignUpBloc>().add(LastNameChanged(value)),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: MySize.spaceBtwItems),
                      // Add more form fields with BlocBuilder for each...
                      const SizedBox(height: MySize.defaultSpace),
                      Row(
                        children: [
                          Checkbox(value: true, onChanged: (value) {}),
                          Text.rich(TextSpan(children: [
                            TextSpan(
                                text: '${TextsStrings.iAgreeTo}  ',
                                style: Theme.of(context).textTheme.bodySmall),
                            TextSpan(
                                text: '${TextsStrings.privacyPolicy}  ',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium!
                                    .apply(
                                  color:
                                  dark ? MyColors.white : MyColors.primary,
                                  decoration: TextDecoration.underline,
                                  decorationColor:
                                  dark ? MyColors.white : MyColors.primary,
                                )),
                            TextSpan(
                                text: '${TextsStrings.and}  ',
                                style: Theme.of(context).textTheme.bodySmall),
                            TextSpan(
                                text: TextsStrings.termsOfUse,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium!
                                    .apply(
                                  color:
                                  dark ? MyColors.white : MyColors.primary,
                                  decoration: TextDecoration.underline,
                                  decorationColor:
                                  dark ? MyColors.white : MyColors.primary,
                                )),
                          ]))
                        ],
                      ),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () => context.read<SignUpBloc>().add(SignUpSubmitted()),
                          child: BlocBuilder<SignUpBloc, SignUpState>(
                            builder: (context, state) {
                              return state.isSubmitting
                                  ? CircularProgressIndicator()
                                  : Text(TextsStrings.createAccount);
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: MySize.spaceBtwItems),
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
                            //   onPressed: () {},
                            //   icon: const Image(
                            //     width: MySize.iconMd,
                            //     height: MySize.iconMd,
                            //     image: AssetImage(ImageStrings.google),
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
                            //   onPressed: () {},
                            //   icon: const Image(
                            //     width: MySize.iconMd,
                            //     height: MySize.iconMd,
                            //     image: AssetImage(ImageStrings.fackbook),
                            //   ),
                            // ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}