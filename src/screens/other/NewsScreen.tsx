import {Platform, StyleSheet, View} from 'react-native';
import React, {useMemo} from 'react';
import ScreenLayout from '../components/ScreenLayout';
import {useRoute} from '@react-navigation/native';
import {mylog} from '../../log';
import WebView from 'react-native-webview';
import {rd, rs} from '../../theme/rd';
type Props = {
  videoId: string; // YouTube video id, e.g. "dQw4w9WgXcQ"
  height?: number; // specific height (optional)
  autoplay?: boolean; // autoplay on load
  controls?: number; // 0,1,2 - show/hide controls
  start?: number; // start time in seconds
  onMessage?: (data: any) => void; // receive messages from iframe if needed
};

const NewsScreen = () => {
  const {params} = useRoute();

  return (
    <ScreenLayout
      title={
        params?.data?.title.length <= 30
          ? params?.data?.title
          : params?.data?.title.slice(0, 30) + '...'
      }
    >
      <View style={styles.content}>
        <WebView
          source={{html: params?.data?.description}}
          // height is to be full Screen
          style={{height: 1000, width: '100%', transform: [{scaleY: 1}]}}
          // V-006: server HTML sanitize'siz keladi → JS'ni O'CHIRAMIZ (stored XSS himoyasi).
          // Yangilik kontenti statik HTML (matn/rasm/media) — JavaScript talab qilmaydi.
          javaScriptEnabled={false}
          domStorageEnabled={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    </ScreenLayout>
  );
};

function YouTubeWebView({
  videoId,
  height = 210,
  autoplay = false,
  controls = 1,
  start = 0,
  onMessage,
}: Props) {
  const html = useMemo(() => {
    const auto = autoplay ? 1 : 0;
    // playsinline needed for autoplay on iOS and to keep inline playback
    return `
      <!doctype html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"/>
          <style>
            html,body { margin:0; padding:0; background-color: black; height:100%; }
            .video { position: absolute; top:0; left:0; right:0; bottom:0; }
          </style>
        </head>
        <body>
          <div id="player" class="video">
            <iframe
              id="ytplayer"
              type="text/html"
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/${videoId}?controls=${controls}&autoplay=${auto}&playsinline=1&rel=0&start=${start}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          </div>
          <script>
            // If you want to post messages back to RN:
            const iframe = document.getElementById('ytplayer');
            window.addEventListener('message', function(e) {
              // forward to RN
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(e.data);
            });
          </script>
        </body>
      </html>
    `;
  }, [videoId, autoplay, controls, start]);

  return (
    <View style={[styles.container, {height, borderRadius: 20}]}>
      <WebView
        originWhitelist={['*']}
        source={{html}}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true} // important for iOS inline playback
        mediaPlaybackRequiresUserAction={
          Platform.OS === 'ios' ? false : undefined
        } // help autoplay on iOS
        onMessage={event => onMessage && onMessage(event.nativeEvent.data)}
      />
    </View>
  );
}
/**
 * Extracts the YouTube video ID from various YouTube URL formats.
 * Supports:
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - With or without extra parameters (?t=123, &list=...)
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Regex for different formats:
  // youtu.be/VIDEO_ID
  // youtube.com/watch?v=VIDEO_ID
  // youtube.com/embed/VIDEO_ID
  const regex =
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/;

  const match = url.match(regex);
  return match ? match[1] : null;
}

export default NewsScreen;

const styles = StyleSheet.create({
  content: {
    paddingTop: rs(8),
  },
  container: {
    backgroundColor: rd.color.surface,
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: rd.radius.xxl,
  },
});
