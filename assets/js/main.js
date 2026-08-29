/*
	Big Picture by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$header = $('#header'),
		$all = $body.add($header);

	// Breakpoints.
		breakpoints({
			xxlarge: [ '1681px',  '1920px' ],
			xlarge:  [ '1281px',  '1680px' ],
			large:   [ '1001px',  '1280px' ],
			medium:  [ '737px',   '1000px' ],
			small:   [ '481px',   '736px'  ],
			xsmall:  [ null,      '480px'  ]
		});

	// Play initial animations on page load.
		$window.on('load', function() {
			setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Touch mode.
		if (browser.mobile)
			$body.addClass('is-touch');
		else {

			breakpoints.on('<=small', function() {
				$body.addClass('is-touch');
			});

			breakpoints.on('>small', function() {
				$body.removeClass('is-touch');
			});

		}

	// Fix: IE flexbox fix.
		if (browser.name == 'ie') {

			var $main = $('.main.fullscreen'),
				IEResizeTimeout;

			$window
				.on('resize.ie-flexbox-fix', function() {

					clearTimeout(IEResizeTimeout);

					IEResizeTimeout = setTimeout(function() {

						var wh = $window.height();

						$main.each(function() {

							var $this = $(this);

							$this.css('height', '');

							if ($this.height() <= wh)
								$this.css('height', (wh - 50) + 'px');

						});

					});

				})
				.triggerHandler('resize.ie-flexbox-fix');

		}

	// Smooth scrolling (Lenis).
	// One scroll loop drives everything: Lenis owns the RAF, GSAP's ticker
	// steps it, ScrollTrigger updates from it, and a native 'scroll' event is
	// re-broadcast so jQuery Scrollex keeps working unchanged.
		var lenis = null;

		if (typeof Lenis !== 'undefined' && !browser.mobile) {

			lenis = new Lenis({
				duration: 1.2,
				easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
				smoothWheel: true,
				wheelMultiplier: 1.0,
				touchMultiplier: 1.2,
				syncTouch: false
			});

			lenis.on('scroll', function() {

				if (typeof ScrollTrigger !== 'undefined')
					ScrollTrigger.update();

				$window.trigger('scroll');

			});

			if (typeof gsap !== 'undefined') {

				gsap.ticker.add(function(time) {
					lenis.raf(time * 1000);
				});

				gsap.ticker.lagSmoothing(0);

			}
			else {

				var raf = function(time) {
					lenis.raf(time);
					requestAnimationFrame(raf);
				};

				requestAnimationFrame(raf);

			}

			// Anchor links go through Lenis instead of Scrolly, so the two
			// don't animate scrollTop against each other.
			$(document).on('click', 'a[href^="#"]', function(event) {

				var href = $(this).attr('href');

				if (href.length < 2)
					return;

				var target = document.getElementById(href.substring(1));

				if (!target)
					return;

				event.preventDefault();
				event.stopImmediatePropagation();

				lenis.scrollTo(target, {
					offset: -($header.outerHeight() - 1),
					duration: 1.4
				});

			});

		}



	// Motion-driven reveals (vanilla Framer Motion).
	// Nothing here is required for content to be readable: elements are only
	// hidden once Motion is confirmed present, so a failed load degrades to
	// plain static content rather than a blank section.
		if (typeof Motion !== 'undefined') {

			var animate = Motion.animate,
				stagger = Motion.stagger,
				inView = Motion.inView,
				ease = [0.22, 1, 0.36, 1];

			// Skill pills.
				var $skills = $('.skills');

				if ($skills.length > 0) {

					$skills.addClass('is-motion');

					inView($skills[0], function() {

						animate(
							'.skills ul.pills li',
							{ opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0px)'] },
							{ duration: 0.5, delay: stagger(0.025), ease: ease }
						);

						return function() {
							animate(
								'.skills ul.pills li',
								{ opacity: 0, transform: 'translateY(14px)' },
								{ duration: 0.2 }
							);
						};

					}, { amount: 0.2 });

				}

			// Outro.
				var $outro = $('#outro');

				if ($outro.length > 0) {

					inView($outro[0], function() {

						animate(
							'#outro .outro-header h2, #outro .outro-header p',
							{ opacity: [0, 1], transform: ['translateY(1em)', 'translateY(0em)'] },
							{ duration: 0.8, delay: stagger(0.12), ease: ease }
						);

						animate(
							'#outro .outro-header nav li',
							{ opacity: [0, 1], transform: ['translateY(1em)', 'translateY(0em)'] },
							{ duration: 0.5, delay: stagger(0.1, { startDelay: 0.35 }), ease: ease }
						);

					}, { amount: 0.3 });

				}

		}

	// GSAP + ScrollTrigger.
	// Scoped to elements nothing else animates: Scrollex owns the section
	// slides, Motion owns the skill pills, so there is no double-animation.
		if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {

			gsap.registerPlugin(ScrollTrigger);

			var reveal = { opacity: 0, y: 28, duration: 0.8, ease: 'power3.out' };
			var REVERSIBLE = 'play none none reverse';

		// Motion (Framer-style Grid / Tile Transition System).
		// Uses a 2D tile grid that performs rotation (rotate: 90deg), scale,
		// and center-out staggered reveal, then reveals the clean hero section.
			var heroPanels = (function() {

				var intro = document.getElementById('intro');

				if (!intro)
					return null;

				if (window.matchMedia
				&&  window.matchMedia('(prefers-reduced-motion: reduce)').matches)
					return null;

				// ── Config ────────────────────────────────────────────────────────
				var COLS         = 5,            // 5 columns
					ROWS         = 3,            // 3 rows (15 total tiles)
					REVEAL_DUR   = 1.3,          // total reveal animation time (s)
					COVER_DUR    = 1.0;          // total cover animation time (s)

				// ── Build 2D Grid DOM ─────────────────────────────────────────────
				var container = document.createElement('div');
				container.className = 'hero-panels';
				container.setAttribute('aria-hidden', 'true');

				var panels = [];

				for (var r = 0; r < ROWS; r++) {
					for (var c = 0; c < COLS; c++) {
						var p = document.createElement('div');
						p.className = 'hero-panel';
						p.style.left   = (c / COLS * 100) + '%';
						p.style.top    = (r / ROWS * 100) + '%';
						p.style.width  = (100 / COLS + 0.1) + '%';
						p.style.height = (100 / ROWS + 0.1) + '%';
						container.appendChild(p);
						panels.push(p);
					}
				}

				intro.appendChild(container);

				// ── State ─────────────────────────────────────────────────────────
				var busy = false;

				// ── Helpers ───────────────────────────────────────────────────────
				var showContainer = function() {
					gsap.set(container, { opacity: 1, pointerEvents: 'none' });
				};

				var hideContainer = function() {
					gsap.set(container, { opacity: 0, pointerEvents: 'none' });
				};

				// Start visible covering hero on initial load
				showContainer();
				gsap.set(panels, {
					scale: 1,
					rotate: 0,
					opacity: 1,
					borderRadius: '0px'
				});

				// ── cover ─────────────────────────────────────────────────────────
				// Reassembles tiles when leaving hero section
				var cover = function() {

					if (busy)
						return;

					busy = true;
					showContainer();

					gsap.fromTo(panels, {
						scale: 0.1,
						rotate: -90,
						opacity: 0,
						borderRadius: '24px'
					}, {
						scale: 1,
						rotate: 0,
						opacity: 1,
						borderRadius: '0px',
						duration: 0.85,
						ease: 'power2.out',
						stagger: {
							grid: [ROWS, COLS],
							from: 'edges',
							amount: 0.45
						},
						onComplete: function() {
							busy = false;
						}
					});

				};

				// ── reveal ────────────────────────────────────────────────────────
				// Tiles rotate 90deg, scale down, and disperse from center outwards
				var reveal = function(delay) {

					if (busy)
						return;

					busy = true;

					gsap.set(panels, {
						scale: 1,
						rotate: 0,
						opacity: 1,
						borderRadius: '0px'
					});
					showContainer();

					gsap.to(panels, {
						scale: 0.05,
						rotate: 90,
						opacity: 0,
						borderRadius: '28px',
						duration: 1.15,
						ease: 'power3.inOut',
						stagger: {
							grid: [ROWS, COLS],
							from: 'center',
							amount: 0.65
						},
						delay: delay || 0,
						onComplete: function() {
							hideContainer();
							busy = false;
						}
					});

				};

				// ── Wire ScrollTrigger ────────────────────────────────────────────
				ScrollTrigger.create({
					trigger: intro,
					start: 'bottom bottom',
					end: 'bottom top',
					onLeave: function() {
						cover();
					},
					onEnterBack: function() {
						reveal(0);
					}
				});

				return {
					// Called once on page load. Returns the time (from now, in
					// seconds) when hero text should start arriving — partway
					// through the reveal so the copy fades in on a nearly-clear hero.
					reveal: function(delay) {
						reveal(delay);
						return (delay || 0) + REVEAL_DUR * 0.6;
					}
				};

			})();

		// Hero: plays once on load, centered around the Name/Title entrance
		// Uses a robust load-check so the animation fires even if the `load`
		// event already triggered before this handler was registered.
			(function heroEntrance() {

				function run() {

					var $hero = $('#intro .content');

					if ($hero.length == 0)
						return;

					var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

					if (reducedMotion)
						return;

					// User interaction tracking so auto-scroll is safely cancelled if user scrolls or clicks
					var userInteracted = false;

					var onUserInteraction = function() {
						userInteracted = true;
						$(window).off('wheel touchstart mousedown keydown', onUserInteraction);
					};

					$(window).on('wheel touchstart mousedown keydown', onUserInteraction);

					// Content arrives partway through the panel reveal so it fades
					// in on a hero that is already mostly uncovered.
					// Note: 0.25 matches heroPanels' LOAD_DELAY constant.
					var delay = (heroPanels ? heroPanels.reveal(0.25) : 0.35);

					// Hero Entrance Timeline centered around the Name/Title
					gsap.timeline({
						delay: delay,
						onComplete: function() {

							// After hero animation completes, smooth scroll to the next section (#one)
							// ONLY if user hasn't already scrolled or interacted, and no specific hash in URL
							var hasHash = window.location.hash && window.location.hash !== '#intro';
							var isAtTop = (window.pageYOffset || document.documentElement.scrollTop || 0) < 50;

							if (!userInteracted && !hasHash && isAtTop) {

								var autoScrollTimeout = setTimeout(function() {

									if (userInteracted)
										return;

									var target = document.getElementById('one');

									if (!target)
										return;

									if (lenis) {
										lenis.scrollTo(target, {
											offset: -($header.outerHeight() - 1),
											duration: 1.6,
											easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
										});
									}
									else {
										$('html, body').animate({
											scrollTop: $(target).offset().top - ($header.outerHeight() - 1)
										}, 1200, 'swing');
									}

								}, 1400); // 1.4s comfortable viewing pause after name reveal

								// Clear timeout immediately if user interacts during the viewing pause
								var cancelAutoScroll = function() {
									clearTimeout(autoScrollTimeout);
									$(window).off('wheel touchstart mousedown keydown', cancelAutoScroll);
								};

								$(window).on('wheel touchstart mousedown keydown', cancelAutoScroll);

							}

						}
					})
					.from('#intro .hero-greeting', {
						opacity: 0,
						y: 20,
						duration: 0.6,
						ease: 'power3.out'
					})
					// Primary animated element: Name with scale 0.96 -> 1, y: 35 -> 0, opacity 0 -> 1
					.from('#intro h2', {
						opacity: 0,
						y: 35,
						scale: 0.96,
						duration: 1.0,
						ease: 'power3.out',
						transformOrigin: '50% 50%'
					}, '-=0.35')
					.from('#intro .hero-tagline', {
						opacity: 0,
						y: 20,
						duration: 0.6,
						ease: 'power3.out'
					}, '-=0.6')
					.from('#intro .hero-desc', {
						opacity: 0,
						y: 20,
						duration: 0.6,
						ease: 'power3.out'
					}, '-=0.45')
					.from('#intro .hero-actions li', {
						opacity: 0,
						y: 20,
						duration: 0.5,
						stagger: 0.12,
						ease: 'power3.out'
					}, '-=0.35')
					.from('#intro .button.down', {
						opacity: 0,
						y: 10,
						duration: 0.6,
						ease: 'power2.out'
					}, '-=0.25');

				}

				// If the page has already loaded, run immediately.
				// Otherwise, wait for the load event.
				if (document.readyState === 'complete') {
					run();
				} else {
					$window.on('load', run);
				}

			})();

			// Hero parallax: content drifts up at ~half scroll speed.
				if ($('#intro .content').length > 0)
					gsap.to('#intro .content', {
						scrollTrigger: {
							trigger: '#intro',
							start: 'top top',
							end: 'bottom top',
							scrub: 0.6
						},
						y: function() { return window.innerHeight * 0.18; },
						ease: 'none'
					});

			// Section headings.
				$('#education, #work, #certificates').each(function() {

					var header = $(this).find('> .content > header')[0];

					if (!header)
						return;

					gsap.from(header.children, {
						scrollTrigger: { trigger: header, start: 'top 85%', toggleActions: REVERSIBLE },
						opacity: 0,
						y: 24,
						duration: 0.7,
						stagger: 0.12,
						ease: 'power3.out'
					});

				});

			// Header: shrink-on-scroll, scroll progress bar, active-link spy.
				gsap.to('#header .header-progress', {
					scrollTrigger: {
						trigger: document.body,
						start: 'top top',
						end: 'bottom bottom',
						scrub: 0.3
					},
					scaleX: 1,
					ease: 'none'
				});

				ScrollTrigger.create({
					start: 'top -80',
					end: 99999,
					onToggle: function(self) {
						$header.toggleClass('is-scrolled', self.isActive);
					}
				});

				$('#header nav a[href^="#"]').each(function() {

					var $link = $(this),
						id = $link.attr('href'),
						section = document.querySelector(id);

					if (!section)
						return;

					var setActive = function(active) {
						if (active) {
							$('#header nav a').removeClass('is-active');
							$link.addClass('is-active');
						}
					};

					ScrollTrigger.create({
						trigger: section,
						start: 'top 45%',
						end: 'bottom 45%',
						onToggle: function(self) { setActive(self.isActive); }
					});

				});

			// Education timeline: line draws, then each entry arrives in turn.
				if ($('.timeline').length > 0) {

					gsap.timeline({
						scrollTrigger: { trigger: '.timeline', start: 'top 80%', toggleActions: REVERSIBLE }
					})
						.from('.timeline .timeline-line', { scaleY: 0, duration: 0.9, ease: 'power2.out' })
						.from('.timeline .timeline-item', {
							opacity: 0,
							x: -28,
							duration: 0.7,
							stagger: 0.22,
							ease: 'power3.out'
						}, '-=0.55')
						.from('.timeline .timeline-dot', {
							scale: 0,
							duration: 0.45,
							stagger: 0.22,
							ease: 'back.out(2.5)'
						}, '-=1.25');

				}

			// Languages: card lifts in, rows stagger, proficiency bars fill.
				if ($('.languages').length > 0) {

					var langTl = gsap.timeline({
						scrollTrigger: { trigger: '.languages', start: 'top 85%', toggleActions: REVERSIBLE }
					});

					langTl
						.from('.languages', {
							opacity: 0,
							y: reveal.y,
							duration: reveal.duration,
							ease: reveal.ease
						})
						.from('.languages .lang-item', {
							opacity: 0,
							x: -20,
							duration: 0.5,
							stagger: 0.15,
							ease: 'power3.out'
						}, '-=0.4');

					$('.languages .lang-bar span').each(function(i) {

						langTl.to(this, {
							width: ($(this).data('level') || 0) + '%',
							duration: 0.9,
							ease: 'power3.out'
						}, '-=' + (i === 0 ? 0.35 : 0.75));

					});

				}

			// Certificates slider.
				if ($('.certs-slider').length > 0)
					gsap.from('.certs-slider', {
						scrollTrigger: { trigger: '.certs-slider', start: 'top 85%', toggleActions: REVERSIBLE },
						opacity: 0,
						scale: 0.94,
						duration: 0.9,
						ease: 'power3.out'
					});

			// Outro parallax on the copyright bar.
				if ($('#outro').length > 0)
					gsap.to('#outro .outro-copyright', {
						scrollTrigger: {
							trigger: '#outro',
							start: 'top bottom',
							end: 'bottom bottom',
							scrub: true
						},
						y: -20,
						ease: 'none'
					});

			// Recalculate once images have settled.
				$window.on('load', function() {
					ScrollTrigger.refresh();
				});

		}

	// Certificates slider.
		if (typeof Swiper !== 'undefined' && $('.certs-slider').length > 0) {

			var certSlideCount = $('.certs-slider .swiper-slide').length;

			new Swiper('.certs-slider', {
				effect: 'coverflow',
				centeredSlides: true,
				slidesPerView: 'auto',
				spaceBetween: 40,
				grabCursor: true,
				watchSlidesProgress: true,
				// Swiper needs >= 2x the visible slides to clone safely; below
				// that it warns and silently disables looping anyway.
				loop: certSlideCount >= 4,
				loopAdditionalSlides: 2,
				// Re-measure when the images finish loading, otherwise slides
				// are sized against zero-height <img> elements.
				observer: true,
				observeParents: true,
				coverflowEffect: {
					rotate: 6,
					stretch: 0,
					depth: 240,
					modifier: 1.4,
					scale: 0.9,
					slideShadows: false
				},
				keyboard: { enabled: true },
				autoplay: {
					delay: 4500,
					disableOnInteraction: false,
					pauseOnMouseEnter: true
				},
				pagination: {
					el: '.certs-slider .swiper-pagination',
					clickable: true
				},
				navigation: {
					nextEl: '.certs-slider .swiper-button-next',
					prevEl: '.certs-slider .swiper-button-prev'
				}
			});

		}

	// Lightbox (certificates).
		(function() {

			var $lightbox = $('#lightbox');

			if ($lightbox.length == 0)
				return;

			var $img = $lightbox.find('img'),
				$caption = $lightbox.find('.lightbox-caption');

			var show = function(src, caption) {

				$img.attr('src', src).attr('alt', caption);
				$caption.text(caption);

				$lightbox
					.addClass('is-visible')
					.attr('aria-hidden', 'false');

			};

			var hide = function() {

				$lightbox
					.removeClass('is-visible')
					.attr('aria-hidden', 'true');

			};

			// Delegated, so Swiper's cloned loop slides work too.
			$(document).on('click', '.cert-link', function(event) {

				event.preventDefault();

				var $this = $(this);

				show($this.attr('href'), $this.find('img').attr('alt') || '');

			});

			$lightbox.on('click', function(event) {

				// Click the backdrop or the close button, not the image itself.
				if (event.target === $lightbox[0]
				||  $(event.target).is('.lightbox-close'))
					hide();

			});

			$window.on('keydown', function(event) {

				if (event.keyCode == 27)
					hide();

			});

		})();

	// Contact form (EmailJS).
		(function() {

			var PUBLIC_KEY  = 'bpK1c1op3XDefmW1V',
				SERVICE_ID  = 'service_qzuw3wf',
				TEMPLATE_ID = 'template_hp5gfmg',
				TO_EMAIL    = 'baidarbakhat40@gmail.com';

			var $form = $('#contactForm');

			if ($form.length == 0)
				return;

			var $status = $('#formStatus'),
				$submit = $form.find('input[type="submit"]');

			// The SDK is a separate <script>; if it failed to load there is no
			// point wiring a submit handler that can only ever fail silently.
			var hasSDK = (typeof emailjs !== 'undefined');

			if (hasSDK)
				emailjs.init(PUBLIC_KEY);
			else
				console.error('EmailJS did not load. Check assets/vendor/emailjs/email.min.js.');

			// Field -> its rule. Kept as data so validation and the submit
			// handler iterate the same list and cannot drift apart.
			var fields = {
				name: {
					$el: $('#contact-name'),
					$error: $('#contact-nameError'),
					validate: function(v) {
						return v ? '' : 'Please enter your name.';
					}
				},
				email: {
					$el: $('#contact-email'),
					$error: $('#contact-emailError'),
					validate: function(v) {
						if (!v)
							return 'Please enter your email address.';

						return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email address.';
					}
				},
				message: {
					$el: $('#contact-message'),
					$error: $('#contact-messageError'),
					validate: function(v) {
						if (!v)
							return 'Please enter a message.';

						return v.length >= 10 ? '' : 'Message should be at least 10 characters.';
					}
				}
			};

			var setStatus = function(text, kind) {

				$status
					.text(text || '')
					.removeClass('is-error is-success is-busy')
					.addClass(text ? (kind ? 'is-' + kind : '') : '');

			};

			var validateField = function(key) {

				var field = fields[key],
					message = field.validate($.trim(field.$el.val()));

				field.$error.text(message);
				field.$el.toggleClass('invalid', message !== '');

				return message === '';

			};

			// Validate on blur, then live-correct once a field is already
			// flagged — re-flagging on every keystroke reads as nagging.
			$.each(fields, function(key, field) {

				field.$el.on('blur', function() { validateField(key); });

				field.$el.on('input', function() {

					if (field.$el.hasClass('invalid'))
						validateField(key);

				});

			});

			$form.on('submit', function(event) {

				event.preventDefault();

				var valid = true;

				// Validate every field, don't short-circuit: the user should
				// see all the problems at once, not one per attempt.
				$.each(fields, function(key) {
					if (!validateField(key))
						valid = false;
				});

				if (!valid) {
					setStatus('Please fix the highlighted fields above.', 'error');
					return;
				}

				if (!hasSDK) {
					setStatus('Email service unavailable — please write to ' + TO_EMAIL + ' directly.', 'error');
					return;
				}

				var name    = $.trim(fields.name.$el.val()),
					email   = $.trim(fields.email.$el.val()),
					message = $.trim(fields.message.$el.val());

				$submit.prop('disabled', true).val('Sending...');
				setStatus('Sending your message...', 'busy');

				// Both naming schemes are sent. EmailJS ignores params the
				// template does not reference, so this works whether the
				// template uses {{name}}/{{email}} or {{from_name}}/{{from_email}}.
				emailjs.send(SERVICE_ID, TEMPLATE_ID, {
					to_email:   TO_EMAIL,
					from_name:  name,
					from_email: email,
					reply_to:   email,
					name:       name,
					email:      email,
					title:      'Portfolio contact from ' + name,
					message:    message
				}).then(function() {

					setStatus('Message sent. Thanks, ' + name + ' — I\'ll reply soon.', 'success');
					$form[0].reset();

					$.each(fields, function(key, field) {
						field.$error.text('');
						field.$el.removeClass('invalid');
					});

					window.setTimeout(function() { setStatus(''); }, 8000);

				}).catch(function(error) {

					console.error('EmailJS error:', error);
					setStatus('Could not send. Please try again, or email ' + TO_EMAIL + ' directly.', 'error');

				}).finally(function() {

					$submit.prop('disabled', false).val('Send Message');

				});

			});

		})();

	// Section transitions.
		if (browser.canUse('transition')) {

			var on = function() {

				// Galleries.
					$('.gallery')
						.scrollex({
							top:		'30vh',
							bottom:		'30vh',
							delay:		50,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

				// Generic sections.
					$('.main.style1')
						.scrollex({
							mode:		'middle',
							delay:		100,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

					$('.main.style2')
						.scrollex({
							mode:		'middle',
							delay:		100,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

				// Contact.
					$('#contact')
						.scrollex({
							top:		'50%',
							delay:		50,
							initialize:	function() { $(this).addClass('inactive'); },
							terminate:	function() { $(this).removeClass('inactive'); },
							enter:		function() { $(this).removeClass('inactive'); },
							leave:		function() { $(this).addClass('inactive'); }
						});

			};

			var off = function() {

				// Galleries.
					$('.gallery')
						.unscrollex();

				// Generic sections.
					$('.main.style1')
						.unscrollex();

					$('.main.style2')
						.unscrollex();

				// Contact.
					$('#contact')
						.unscrollex();

			};

			breakpoints.on('<=small', off);
			breakpoints.on('>small', on);

		}

	// Events.
		var resizeTimeout, resizeScrollTimeout;

		$window
			.on('resize', function() {

				// Disable animations/transitions.
					$body.addClass('is-resizing');

				clearTimeout(resizeTimeout);

				resizeTimeout = setTimeout(function() {

					// Update scrolly links.
					// Skipped when Lenis is driving: Scrolly binds directly to
					// each anchor, so it would fire before the delegated Lenis
					// handler and both would animate scrollTop at once.
						if (!lenis)
							$('a[href^="#"]').scrolly({
								speed: 1500,
								offset: $header.outerHeight() - 1
							});

					// Re-enable animations/transitions.
						setTimeout(function() {
							$body.removeClass('is-resizing');
							$window.trigger('scroll');
						}, 0);

				}, 100);

			})
			.on('load', function() {
				$window.trigger('resize');
			});

})(jQuery);