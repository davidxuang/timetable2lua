import CRT from './vendor/crt';

switch (new URL(document.URL).hostname) {
  case 'www.cqmetro.cn':
    CRT.bootstrap();
    break;
}
