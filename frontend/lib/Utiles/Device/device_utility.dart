import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class DeviceUtility {

  static void hideKeyboard(BuildContext context) {
    FocusScope.of(context).requestFocus(FocusNode());
  }

  static Future<void> setStatusBarColor(Color color) async {
    SystemChrome.setSystemUIOverlayStyle(
      SystemUiOverlayStyle(statusBarColor: color),
    );
  }

  static bool isLandscapeOrientation(BuildContext context) {
    return MediaQuery
        .of(context)
        .orientation == Orientation.landscape;
  }


  static bool isPortraitOrientation(BuildContext context) {
    return MediaQuery
        .of(context)
        .orientation == Orientation.portrait;
  }


  static void setFullScreenMode(bool enable) {
    SystemChrome.setEnabledSystemUIMode(
        enable ? SystemUiMode.immersiveSticky : SystemUiMode.edgeToEdge
    );
  }

  static double getScreenHeight(BuildContext context) {
    return MediaQuery
        .of(context)
        .size
        .height;
  }

  static double getScreenWidth(BuildContext context) {
    return MediaQuery
        .of(context)
        .size
        .width;
  }

  static double getPixelRatio(BuildContext context) {
    return MediaQuery
        .of(context)
        .devicePixelRatio;
  }

  static double getStatusBarHeight(BuildContext context) {
    return MediaQuery
        .of(context)
        .padding
        .top;
  }

  static double getBottomNavBarHeight(BuildContext context) {
    return MediaQuery
        .of(context)
        .padding
        .bottom;
  }

  static double getAppBarHeight(AppBar appBar) {
    return appBar.preferredSize.height;
  }

  static double getKeyboardHeight(BuildContext context) {
    return MediaQuery.of(context).viewInsets.bottom;
  }

  static Future<bool> isKeyboardVisible(BuildContext context) async {
    return MediaQuery
        .of(context)
        .viewInsets
        .bottom > 0;
  }

  static Future<bool> isPhysicalDevice() async {
    return Platform.isAndroid || Platform.isIOS;
  }

  static void vibrate(Duration duration) {
    HapticFeedback.vibrate();
    Future.delayed(duration, () => HapticFeedback.vibrate());
  }

  static Future<void> setPreferredOrientations(
      List<DeviceOrientation> orientations) async {
    await SystemChrome.setPreferredOrientations(orientations);
  }

  static void hideStatusBar() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.manual, overlays: []);
  }

  static void showStatusBar() {
    SystemChrome.setEnabledSystemUIMode(
        SystemUiMode.manual, overlays: SystemUiOverlay.values);
  }

  static bool isIOS() {
    return Platform.isIOS;
  }

  static bool isAndroid() {
    return Platform.isAndroid;
  }


  // static void launchUrl(String url) async {
  //   if (await canLaunchString(url)) {
  //     await launchString(url);
  //   } else {
  //     throw 'Could not launch $url';
  //   }
  // }
}