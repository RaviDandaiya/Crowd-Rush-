package com.ravidandaiya.crowdrush;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.widget.RelativeLayout;
import com.getcapacitor.BridgeActivity;
import com.unity3d.ads.IUnityAdsInitializationListener;
import com.unity3d.ads.IUnityAdsLoadListener;
import com.unity3d.ads.IUnityAdsShowListener;
import com.unity3d.ads.UnityAds;
import com.unity3d.ads.UnityAdsShowOptions;
import com.unity3d.services.banners.BannerErrorInfo;
import com.unity3d.services.banners.BannerView;
import com.unity3d.services.banners.UnityBannerSize;

public class MainActivity extends BridgeActivity {
    private static final String GAME_ID = "6051910";
    private static final String REWARDED_PLACEMENT = "Rewarded_Android";
    private static final String BANNER_PLACEMENT = "Banner_Android";
    
    private BannerView bannerView;
    private RelativeLayout layout;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemUI();

        // Initialize Unity Ads SDK
        UnityAds.initialize(getApplicationContext(), GAME_ID, false, new IUnityAdsInitializationListener() {
            @Override
            public void onInitializationComplete() {
                loadRewardedAd();
                runOnUiThread(() -> {
                    if (bannerView != null) {
                        bannerView.load();
                    }
                });
            }

            @Override
            public void onInitializationFailed(UnityAds.UnityAdsInitializationError error, String message) {
            }
        });

        // Setup layouts
        runOnUiThread(() -> {
            View webView = MainActivity.this.bridge.getWebView();
            ViewGroup parent = (ViewGroup) webView.getParent();
            if (parent != null) {
                parent.removeView(webView);
            }

            layout = new RelativeLayout(MainActivity.this);
            RelativeLayout.LayoutParams webViewParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
            );
            layout.addView(webView, webViewParams);

            // Create Banner View
            bannerView = new BannerView(MainActivity.this, BANNER_PLACEMENT, new UnityBannerSize(320, 50));
            RelativeLayout.LayoutParams bannerParams = new RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.WRAP_CONTENT
            );
            bannerParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
            bannerParams.addRule(RelativeLayout.CENTER_HORIZONTAL);
            bannerView.setLayoutParams(bannerParams);
            bannerView.setVisibility(View.GONE);

            layout.addView(bannerView);
            setContentView(layout);
        });

        // Bind JS Interface
        this.bridge.getWebView().addJavascriptInterface(new WebAppInterface(), "Android");
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemUI();
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    private void loadRewardedAd() {
        UnityAds.load(REWARDED_PLACEMENT, new IUnityAdsLoadListener() {
            @Override
            public void onUnityAdsAdLoaded(String placementId) {
            }

            @Override
            public void onUnityAdsFailedToLoad(String placementId, UnityAds.UnityAdsLoadError error, String message) {
                new android.os.Handler().postDelayed(() -> loadRewardedAd(), 5000);
            }
        });
    }

    class WebAppInterface {
        @JavascriptInterface
        public void showBanner() {
            runOnUiThread(() -> {
                if (bannerView != null) {
                    bannerView.setVisibility(View.VISIBLE);
                }
            });
        }

        @JavascriptInterface
        public void hideBanner() {
            runOnUiThread(() -> {
                if (bannerView != null) {
                    bannerView.setVisibility(View.GONE);
                }
            });
        }

        @JavascriptInterface
        public void showAd(String type) {
            runOnUiThread(() -> {
                UnityAds.show(MainActivity.this, REWARDED_PLACEMENT, new UnityAdsShowOptions(), new IUnityAdsShowListener() {
                    @Override
                    public void onUnityAdsShowFailure(String placementId, UnityAds.UnityAdsShowError error, String message) {
                        sendRewardResult(false);
                        loadRewardedAd();
                    }

                    @Override
                    public void onUnityAdsShowStart(String placementId) {
                    }

                    @Override
                    public void onUnityAdsShowClick(String placementId) {
                    }

                    @Override
                    public void onUnityAdsShowComplete(String placementId, UnityAds.UnityAdsCompletionState state) {
                        if (state == UnityAds.UnityAdsCompletionState.COMPLETED) {
                            sendRewardResult(true);
                        } else {
                            sendRewardResult(false);
                        }
                        loadRewardedAd();
                    }
                });
            });
        }

        private void sendRewardResult(final boolean success) {
            MainActivity.this.bridge.getWebView().post(() -> {
                MainActivity.this.bridge.getWebView().evaluateJavascript(
                    "if (window.onUnityAdFinished) { window.onUnityAdFinished(" + success + "); }", null
                );
            });
        }
    }
}
