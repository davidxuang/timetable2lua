import CRT from './vendor/crt.js';

switch (new URL(document.URL).hostname) {
  case 'www.cqmetro.cn':
    CRT.bootstrap();
    break;
}
