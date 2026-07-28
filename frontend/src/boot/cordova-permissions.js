import { boot } from 'quasar/wrappers';

// On the Cordova (Android) build, the WebView will only allow getUserMedia
// (camera) and geolocation once the matching Android runtime permissions are
// granted. Request them up-front on deviceready.
export default boot(() => {
  document.addEventListener(
    'deviceready',
    () => {
      const perms = window.cordova?.plugins?.permissions;
      if (!perms) return;
      const needed = [
        perms.CAMERA,
        perms.ACCESS_FINE_LOCATION,
        perms.ACCESS_COARSE_LOCATION,
      ];
      perms.requestPermissions(needed, () => {}, () => {});
    },
    false
  );
});
