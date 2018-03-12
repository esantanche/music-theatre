/**
 * @ngdoc overview
 * @name Videoplayerhelper
 * @description This service handles the videoplayer. It initialises it, prepares the chapters array and
 * calculates start time and duration of a track.
 */

var videoplayerhelperServices = angular.module('videoplayerhelperServices',
    [ 'clientexceptionhelperServices' ]);

/**
 * @ngdoc service
 * @name Videoplayerhelper.service:Videoplayerhelper
 * @description This service deal with the video player. It initialises the player
 * when the application load, and then when a full movie, a preview or a track
 * need to be played.
 * No operation should be performed on the videoplayer outside this service.
 * @requires Clientexceptionhelper.service:Clientexceptionhelper
 */
videoplayerhelperServices.service('Videoplayerhelper', [ 'Clientexceptionhelper',
    function(Clientexceptionhelper) {

        /** @ngdoc method
         * @name initialise_player
         * @description Initialisation of the player.
         *
         * There are four types of initialisation:
         *
         * - First initialisation on app load
         * - Preview initialisation
         * - Full movie initialisation
         * - Track initialisation
         *
         * Events table:
         *
         * - onPlayMovieClick: Play a full movie
         * - onPlayPreviewClick: Play a preview
         * - ngPlayTrack: Play a track
         * - initialise: First load initialisation
         *
         * The first initialisation on app load is needed otherwise the player wouldn't
         * show up when playing a movie, a preview or a track. The user would have to
         * press the play button twice.
         *
         * @methodOf Videoplayerhelper.service:Videoplayerhelper
         * @param {string} event_name See table above
         * @param {object} urlskit Signed urls to be used to play previews, full movies and tracks
         * @param {array} tracks The tracks array containing an object for each track
         * @param {object} track_to_play The track to play, or nothing if it
         * isn't a track that we have to play
         */
        this.initialise_player = function(event_name, urlskit, tracks, track_to_play) {

            console.debug('@Videoplayerhelper::initialise_player event: ' + event_name);
            console.debug('    urlskit');
            console.debug(urlskit);

            var video_url;
            var video_subtitles;
            var chapters = [];
            var start = 0; // start = 0 and duration = 0 means that the player has to play the entire movie
            var duration = 0;

            if (typeof(track_to_play) === 'undefined') track_to_play = null;

            switch(event_name)
            {
                case 'onPlayMovieClick':
                    video_url = urlskit.movie_url;
                    video_subtitles = urlskit.subtitles_url;
                    // When we play the full movie, we give to the player information about
                    // the tracks, where they begin and the tooltip.
                    // The player calls them chapters whilst we call them tracks.
                    chapters = this.make_chapters_from_tracks(tracks);
                    break;
                case 'onPlayPreviewClick':
                    video_url = urlskit.preview_url;
                    video_subtitles = urlskit.preview_subtitles_url;
                    // No chapters when playing a preview
                    break;
                case 'ngPlayTrack':
                    // This is Angular wanting to play a track from the tracks list
                    // No chapters when playing a track
                    video_url = urlskit.movie_url;
                    video_subtitles = urlskit.subtitles_url;
                    // The player will actually play the full movie, but starting from
                    // the starting point of the track. It will stop after the duration of the
                    // track has elapsed.

                    // time_in and time_out are in milliseconds, but Flowplayer wants start and
                    // duration in seconds. That's why we are dividing by 1000

                    start = track_to_play.time_in / 1000;
                    duration = (track_to_play.time_out - track_to_play.time_in) / 1000;

                    break;
                case 'initialise':
                    // We have to initialise the video player when the application starts
                    video_url = '';
                    video_subtitles = '';
                    //console.debug('DBG-8181 initialise_player initialise');
                    break;
                default:
                    console.error('W3E040 Event not handled. Event: ' + event_name);
                    Clientexceptionhelper.send_client_exception('W3E040 Event not handled. Event: ' + event_name);
                    return;
            }

            //console.debug('DBG-1076 initialise_player event: ' + event_name);

            // @todo The languages handling here is just experimental

            var languages = [];

            // @todo the empty_subtitles_file.srt shouldn't stay in the website root

            // @todo using a test subtitles file and a chapters one as well

            //video_subtitles = '/test_please_delete_me.srt';
            //
            //// Empty subtitles file in case the user doesn't want them
            //languages.push({
            //    name: 'none',
            //    title: 'None',
            //    flag: '/images/cc.png',
            //    file: 'test_please_delete_me.srt' // @todo fix this 'http://hwcdn.net/x6w9t5c9/cds/srt/trailers/empty_subtitles_file.srt'
            //});
            //
            //// English subtitles only for now
            //languages.push({
            //    name: 'en',
            //    title: 'English',
            //    flag: '/images/en.png',
            //    file: video_subtitles
            //});

            //console.debug('DBG-7YGV languages here');
            //console.debug(languages);

            // @todo just testing here
            //video_url =  "http://stream.flowplayer.org/httpstreaming/sample3_500kbps.f4m";
            //video_url = "http://stream.flowplayer.org/httpstreaming/bauhaus.mp4";
            //video_url = "http://tscdn03.adia.tv/hts/akm_s03/_definst_/tests/sample.mp4/manifest.f4m";

            // @toto testing Skypark CDN
            //video_url =

            // @todo testing here

            //chapters = [];
            //
            //chapters.push( { time: 10,
            //    text: 'chap 10s' } );
            //
            //chapters.push( { time: 20,
            //    text: 'chap 20s' } );
            //
            //start = 0;
            //duration = 0;

            //stream.flowplayer.org/bauhaus.mp4

            //video_url += "?start=0";

            console.debug('chapters before');
            console.debug(chapters);


            //chapters = '/jwplayer/Test_files_for_jwplayer/chapters.vtt';
            if (event_name == 'onPlayMovieClick')
                chapters = '/subtitles/chaps-for-nabucco.vtt';
            else
                chapters = '';

            // /vol/WORKnARCH/SwProjects/musictheatre/production/frontends/angular/app/subtitles/chaps-for-nabucco.vtt
            //chapters = '';

            //video_url = 'http://496679991.r.worldcdn.net/www.jazzonthe.net/10330000_nabucco_piacenza_burchuladze_x_kf50_9_ca3_br600.mp4';


            console.debug('@Videoplayerhelper.service:Videoplayerhelper.initialise_player video_url');
            console.debug(video_url);
            console.debug(video_subtitles);
            console.debug(chapters);


            // @todo does startparam change anything?
            // it doesn't look like

            // @todo no chapters if preview

            jwplayer('videoplayer').setup({
                skin: {
                    name: "roundster"
                },
                height: 360,
                width: 640,
                //primary: 'flash', // @todo get rid of this
                //startparam: "start",
                key: '7Y7kl9rlrkYf19/99buN2hvIPsQEOVS93TQyXA==',
                playlist: [{
                    file: video_url,
                    image: "http://musictheatre.tv/backend/sites/default/files/tag_ring/10330000_nabucco_piacenza_ambrogio_maestri_verdi_240x135.jpg",
                    //image: "/jwplayer/Test_files_for_jwplayer/image4jw.jpg",
                    //startparam: "start",
                    //start: 30, // @todo get rid of this
                    //duration: 10,
                    tracks: [{
                        file: video_subtitles,
                        label: "English",
                        kind: "captions",
                        "default": true
                    },
                    {
                        file: chapters,
                        kind: 'chapters'
                    }
                    ]
                }]
            });

            //frontends/angular/app/jwplayer/Test_files_for_jwplayer/

            //height: 360,
            //    width: 640,

            //var fp = flowplayer('videoplayer', '/flowplayer/fp.MusicTheatre-3.2.12.swf', {
            //    debug: false,
            //    // wmode: "opaque",
            //    key: '#$566fee6b2380c666549', // @todo this license key should be associated with musictheatre.tv
            //    log: {
            //        level: 'debug' // possible values: 'error', 'warn', 'info', 'debug'.
            //        // filter: 'org.flowplayer.captions.*'
            //        // filter:'org.flowplayer.bwcheck.* org.flowplayer.cluster.*'
            //    },
            //    onError: function(errorCode, errorMessage) {
            //        console.error('W3E041 Flowplayer error. Error: ' + errorCode +
            //            ' - ' + errorMessage);
            //        Clientexceptionhelper.send_client_exception('W3E041 Flowplayer error. Error: ' + errorCode +
            //            ' - ' + errorMessage);
            //        // @todo any message to the user here?
            //        // alert('FIXME Flowplayer error');
            //    },
            //    onLoad: function () {  // for debugging and future functions
            //        //alert("player loaded.");
            //        console.info('Flowplayer loaded');
            //    },
            //    onFinish: function () {  // for debugging and future functions
            //        //alert("the end...");
            //        console.info('End of clip');
            //        // Calling the function event_from_videoplayer in the TagViewCtrl
            //        // controller. The latter will process this event to display
            //        // a panel and ask the user to rate the clip the player just played
            //        appscope_tagview().event_from_videoplayer('end of clip event from flowplayer, url: ' + video_url);
            //    },
            //    clip: { // @todo testing pseudo streaming
            //        provider: 'pseudo',
            //        url: 'http://p.demo.flowplayer.netdna-cdn.com/vod/demo.flowplayer/bbb-800.mp4',
            //        chapters: chapters
            //    },
            //    //clip: {
            //    //    url: video_url,
            //    //    baseUrl: '',
            //    //    autoPlay: true,
            //    //    autoBuffering: true,
            //    //    start: start,
            //    //    duration: duration,
            //    //    chapters: chapters,
            //    //    accelerated: true,
            //    //    urlResolvers: ['f4m', 'bwcheck'],
            //    //    languages: languages,
            //    //    selectedLanguage: 'none'
            //    //},
            //    canvas: {
            //        background: '#000',
            //        backgroundGradient: 'none'
            //    },
            //    plugins: {
            //        captions: {
            //            url: '/flowplayer/flowplayer.captions-MusicTheatre-3.2.3.swf?' + Math.random(),
            //            // The content plugin we use to show the captions is called subtitles
            //            captionTarget: 'subtitles',
            //            button: false
            //        },
            //        controls: {
            //            autoHide: 'fullscreen',
            //            tooltipColor: '#7e33d1',
            //            tooltipTextColor: '#ffffff',
            //            chapterTextColor: '#ffffff',
            //            chapterColor: '#7e33d1'
            //        },
            //        pseudo: { // @todo testing pseudostreaming
            //            url: "/flowplayer/flowplayer.pseudostreaming-3.2.13.swf"
            //        }
            //        //f4m: {
            //        //    url: '/flowplayer/flowplayer.f4m-3.2.9.swf'
            //        //},
            //        //httpstreaming: {
            //        //    url: '/flowplayer/flowplayer.httpstreaming-3.2.12.swf'
            //        //},
            //        //bwcheck: {
            //        //    url: '/flowplayer/flowplayer.bwcheck-httpstreaming-3.2.10.swf',
            //        //    dynamic: true,
            //        //    qos: {
            //        //        screen: false,
            //        //        frames: false,
            //        //        ruleCheckInterval: 3000
            //        //    },
            //        //    netConnectionUrl: 'http://bigsool.com/',
            //        //    onStreamSwitchBegin: function () {
            //        //        console.debug('DBG-8XEG flowplayer is switching stream');
            //        //    }
            //        //}
            //    }
            //});

        };

        /**
         * @ngdoc method
         * @name make_chapters_from_tracks
         * @description Flowplayer needs an array that describes the chapters which are the tracks
         * in our terminology. Thanks to this array, flowplayer will be able to display the
         * points in which tracks begin and a tooltip as well.
         * @methodOf Videoplayerhelper.service:Videoplayerhelper
         * @param {array} tracks The tracks array containing an object for each track
         * @returns {Array} Chapters array
         */
        this.make_chapters_from_tracks = function(tracks) {

            //console.debug('DBG-0987 make_chapters_from_tracks');
            //console.debug(tracks);

            var chapters = [];

            for (var track_iter in tracks) {

                var current_track = tracks[track_iter];

                var current_track_time_in = current_track.time_in;

                // Don't show a chapter mark if the track begins at time zero
                if (current_track_time_in > 0) {

                    var current_track_title = current_track.title;
                    var current_track_tooltip = current_track.track_tooltip;

                    // This is the text that flowplayer will show as tooltip
                    // when we hover on the chapter mark
                    var chapter_text = current_track_title + '\n' + current_track_tooltip;

                    // Flowplayer doesn't work if the chapter text includes & or '
                    chapter_text = chapter_text.replace(/[&]/g, 'and');
                    // &#8217 is ’ which is a harmless apostrophe
                    chapter_text = chapter_text.replace(/[\']/g, '&#8217;');

                    // Flowplayer needs to know where to place a chapter mark
                    // In our case it's when a track begins
                    // Flowplayer needs a tooltip to display the chapter mark on mouse over
                    chapters.push( { time: current_track_time_in / 1000,
                                     text: chapter_text } );

                }

            }

            //console.debug(chapters);

            return chapters;

        };

    }

]);
