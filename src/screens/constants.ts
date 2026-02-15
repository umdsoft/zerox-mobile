import { io } from 'socket.io-client';
import { sortText } from './components/StatisticCard';
import { settingDate } from './other/UserDetails';
import { t } from 'i18next';

// const URL = 'https://app.zerox.uz/api/v1';
const URL = 'https://trembl-racks-advised-sandy.trycloudflare.com/api/v1';
// export const SOCKET_URL = 'http://app.zerox.uz';
export const SOCKET_URL =
  'https://trembl-racks-advised-sandy.trycloudflare.com';
export const socket = io(SOCKET_URL, {
  timeout: 5000,
});

const createStatus = 201;
const errorStatus = 400;
const successStatus = 200;
export { URL, createStatus, errorStatus, successStatus };

const htmlStyle = `<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="style.css">
<style>
body {
  background: #ffffff;
  padding: 0 24px;
  margin: 0;
  height: 100vh;
  /* color: white; */
  display: flex;
  justify-content: center;
  /* align-items: center; */
}
.textxx{
  font-family: "Montserrat-Medium";
}
.sum {
  color: #48bb78;
  font-family: "Montserrat-Medium";
  margin-top: 10px;
}
.main {
  background-color: white;
  width: 400px;
  align-items: center;
  justify-content: center;
}
// .svg {
//   align-self: center;
//   align-items: center;
// }
.kom {
}
.svgown {
  align-items: center;
  align-self: center;
  margin-left: 10px;
}
.komtext {
  font-family: "Montserrat-Medium";
  color: black;
}
.title {
  font-family: "Montserrat-Medium";
  font-size: 16px;
  color: black;
  opacity: 0.5;
}
.text {
  font-family: "Montserrat-Medium";
  color: black;
}
.titlex {
  align-items: center;
  justify-content: center;
  display : flex;
  flex-direction :column

}
</style>
</head>`;

export const renderHTMLS = (data: any) => {
  const renderText = (type: number) => {
    console.log(type, 'type');
    switch (type) {
      case 2:
        return t('642');
      case 3:
        return t('642');
      case 4:
        return t('Mobil hisobni to’ldirish');
      case 1:
        return t('654');
      case 5:
        return t('Bekor qilingan to’lov');
      default:
        return t('654');
    }
  };
  switch (data.type) {
    case 3:
      return `<html lang="en">
      ${htmlStyle}
      <body>
        <div class="main">
          <div class ="titlex">
            <div class="kom">
            <p class="komtext">${renderText(data.type)}</p>
            </div>
            <div class="svg">
              <svg class="svgown" width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M30 2.5C14.8125 2.5 2.5 14.8125 2.5 30C2.5 45.1875 14.8125 57.5 30 57.5C45.1875 57.5 57.5 45.1875 57.5 30C57.5 14.8125 45.1875 2.5 30 2.5ZM41.92 25.35C42.1395 25.0991 42.3066 24.8068 42.4115 24.4904C42.5163 24.174 42.5569 23.8398 42.5307 23.5075C42.5045 23.1751 42.4121 22.8514 42.2589 22.5553C42.1058 22.2592 41.895 21.9968 41.6389 21.7834C41.3828 21.5699 41.0866 21.4099 40.7677 21.3127C40.4489 21.2154 40.1138 21.1829 39.7822 21.2171C39.4506 21.2512 39.1292 21.3514 38.8369 21.5116C38.5445 21.6718 38.2872 21.8889 38.08 22.15L27.33 35.0475L21.7675 29.4825C21.296 29.0271 20.6645 28.7751 20.009 28.7808C19.3535 28.7865 18.7265 29.0494 18.263 29.513C17.7994 29.9765 17.5365 30.6035 17.5308 31.259C17.5251 31.9145 17.7771 32.546 18.2325 33.0175L25.7325 40.5175C25.9781 40.763 26.2722 40.9546 26.596 41.0802C26.9198 41.2057 27.2662 41.2624 27.6132 41.2466C27.9601 41.2309 28.2999 41.143 28.611 40.9886C28.9221 40.8342 29.1976 40.6167 29.42 40.35L41.92 25.35Z" fill="#48BB78" />
              </svg>
            </div>
            <div>
              <div class="sum">${sortText(data.amount)} UZS</div>
            </div>
          </div>
          <div>
            <p class="title">
                ${t('Jo’natuvchi')}
            </p>
            <p class="text">
              ${data?.dname}
            </p>
          </div>
          <div>
            <p class="title">
                ${t('Qabul qiluvchi')}
            </p>
            <p class="text">
              ${data?.cname}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('oooooo')}
            </p>
            <p class="textxx">
            ${sortText(data.amount)} UZS
            </p>
          </div>
          <div>
            <p class="title">
           ${t('Amaliyot sanasi')}
            </p>
            <p class="text">
          ${settingDate(data?.created_at)}

          ${data?.time?.slice(0, 5)}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot ID raqami')}
            </p>
            <p class="text">
            ${data?.id}
            </p>
          </div>
        </div>

        <script src="src/script.js"></script>
      </body>

      </html>`;
    case 2:
      return `<html lang="en">
      ${htmlStyle}

      <body>
        <div class="main">
          <div class ="titlex">
            <div class="kom">
            <p class="komtext">${renderText(data.type)}</p>
            </div>
            <div class="svg">
              <svg class="svgown" width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M30 2.5C14.8125 2.5 2.5 14.8125 2.5 30C2.5 45.1875 14.8125 57.5 30 57.5C45.1875 57.5 57.5 45.1875 57.5 30C57.5 14.8125 45.1875 2.5 30 2.5ZM41.92 25.35C42.1395 25.0991 42.3066 24.8068 42.4115 24.4904C42.5163 24.174 42.5569 23.8398 42.5307 23.5075C42.5045 23.1751 42.4121 22.8514 42.2589 22.5553C42.1058 22.2592 41.895 21.9968 41.6389 21.7834C41.3828 21.5699 41.0866 21.4099 40.7677 21.3127C40.4489 21.2154 40.1138 21.1829 39.7822 21.2171C39.4506 21.2512 39.1292 21.3514 38.8369 21.5116C38.5445 21.6718 38.2872 21.8889 38.08 22.15L27.33 35.0475L21.7675 29.4825C21.296 29.0271 20.6645 28.7751 20.009 28.7808C19.3535 28.7865 18.7265 29.0494 18.263 29.513C17.7994 29.9765 17.5365 30.6035 17.5308 31.259C17.5251 31.9145 17.7771 32.546 18.2325 33.0175L25.7325 40.5175C25.9781 40.763 26.2722 40.9546 26.596 41.0802C26.9198 41.2057 27.2662 41.2624 27.6132 41.2466C27.9601 41.2309 28.2999 41.143 28.611 40.9886C28.9221 40.8342 29.1976 40.6167 29.42 40.35L41.92 25.35Z" fill="#48BB78" />
              </svg>
            </div>
            <div>
              <div class="sum">${sortText(data.amount)} UZS</div>
            </div>
          </div>
          <div>
            <p class="title">
                ${t('Jo’natuvchi')}
            </p>
            <p class="text">
              ${data?.cname}
            </p>
          </div>
          <div>
          <p class="title">
              ${t('Qabul qiluvchi')}
          </p>
          <p class="text">
            ${data?.dname}
          </p>
        </div>
          <div>
            <p class="title">
           ${t('oooooo')}
            </p>
            <p class="textxx">
            ${sortText(data.amount)} UZS
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot sanasi')}
            </p>
            <p class="text">
          ${settingDate(data?.created_at)}

          ${data?.time?.slice(0, 5)}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot ID raqami')}
            </p>
            <p class="text">
            ${data?.id}
            </p>
          </div>
        </div>
      </body>

      </html>`;
    case 1:
      return `<html lang="en">
      ${htmlStyle}

      <body>
        <div class="main">
          <div class ="titlex">
            <div class="kom">
            <p class="komtext">${renderText(data.type)}</p>
            </div>
            <div class="svg">
              <svg class="svgown" width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M30 2.5C14.8125 2.5 2.5 14.8125 2.5 30C2.5 45.1875 14.8125 57.5 30 57.5C45.1875 57.5 57.5 45.1875 57.5 30C57.5 14.8125 45.1875 2.5 30 2.5ZM41.92 25.35C42.1395 25.0991 42.3066 24.8068 42.4115 24.4904C42.5163 24.174 42.5569 23.8398 42.5307 23.5075C42.5045 23.1751 42.4121 22.8514 42.2589 22.5553C42.1058 22.2592 41.895 21.9968 41.6389 21.7834C41.3828 21.5699 41.0866 21.4099 40.7677 21.3127C40.4489 21.2154 40.1138 21.1829 39.7822 21.2171C39.4506 21.2512 39.1292 21.3514 38.8369 21.5116C38.5445 21.6718 38.2872 21.8889 38.08 22.15L27.33 35.0475L21.7675 29.4825C21.296 29.0271 20.6645 28.7751 20.009 28.7808C19.3535 28.7865 18.7265 29.0494 18.263 29.513C17.7994 29.9765 17.5365 30.6035 17.5308 31.259C17.5251 31.9145 17.7771 32.546 18.2325 33.0175L25.7325 40.5175C25.9781 40.763 26.2722 40.9546 26.596 41.0802C26.9198 41.2057 27.2662 41.2624 27.6132 41.2466C27.9601 41.2309 28.2999 41.143 28.611 40.9886C28.9221 40.8342 29.1976 40.6167 29.42 40.35L41.92 25.35Z" fill="#48BB78" />
              </svg>
            </div>
            <div>
              <div class="sum">${sortText(data.amount)} UZS</div>
            </div>
          </div>
          <div>
            <p class="title">
            ${t('Foydalanuvchi')}
            </p>
            <p class="text">
              ${data?.dname}
            </p>
          </div>
          <div>
          <p class="title">
         ${t('660')}
          </p>
          <p class="text">
            ${data?.number}
          </p>
        </div>
          <div>
            <p class="title">
            ${t('663')}
            </p>
            <p class="textxx">
            ${sortText(data.amount)} UZS
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot sanasi')}
            </p>
            <p class="text">
          ${settingDate(data?.created_at)}

          ${data?.time?.slice(0, 5)}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot ID raqami')}
            </p>
            <p class="text">
            ${data?.id}
            </p>
          </div>
        </div>
      </body>
      </html>`;
    case 4:
      return `<html lang="en">
      ${htmlStyle}

      <body>
        <div class="main">
          <div class ="titlex">
            <div class="kom">
            <p class="komtext">${renderText(data.type)}</p>
            </div>
            <div class="svg">
              <svg class="svgown" width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M30 2.5C14.8125 2.5 2.5 14.8125 2.5 30C2.5 45.1875 14.8125 57.5 30 57.5C45.1875 57.5 57.5 45.1875 57.5 30C57.5 14.8125 45.1875 2.5 30 2.5ZM41.92 25.35C42.1395 25.0991 42.3066 24.8068 42.4115 24.4904C42.5163 24.174 42.5569 23.8398 42.5307 23.5075C42.5045 23.1751 42.4121 22.8514 42.2589 22.5553C42.1058 22.2592 41.895 21.9968 41.6389 21.7834C41.3828 21.5699 41.0866 21.4099 40.7677 21.3127C40.4489 21.2154 40.1138 21.1829 39.7822 21.2171C39.4506 21.2512 39.1292 21.3514 38.8369 21.5116C38.5445 21.6718 38.2872 21.8889 38.08 22.15L27.33 35.0475L21.7675 29.4825C21.296 29.0271 20.6645 28.7751 20.009 28.7808C19.3535 28.7865 18.7265 29.0494 18.263 29.513C17.7994 29.9765 17.5365 30.6035 17.5308 31.259C17.5251 31.9145 17.7771 32.546 18.2325 33.0175L25.7325 40.5175C25.9781 40.763 26.2722 40.9546 26.596 41.0802C26.9198 41.2057 27.2662 41.2624 27.6132 41.2466C27.9601 41.2309 28.2999 41.143 28.611 40.9886C28.9221 40.8342 29.1976 40.6167 29.42 40.35L41.92 25.35Z" fill="#48BB78" />
              </svg>
            </div>
            <div>
              <div class="sum">${sortText(data.amount)} UZS</div>
            </div>
          </div>
          <div>
            <p class="title">
            ${t('Foydalanuvchi')}
            </p>
            <p class="text">
              ${data?.dname}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('oooooo')}
            </p>
            <p class="textxx">
            ${sortText(data.amount)} UZS
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot sanasi')}
            </p>
            <p class="text">
          ${settingDate(data?.created_at)}

          ${data?.time?.slice(0, 5)}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot ID raqami')}
            </p>
            <p class="text">
            ${data?.id}
            </p>
          </div>
        </div>
      </body>
      </html>`;
    case 5:
      return `<html lang="en">
      ${htmlStyle}

      <body>
        <div class="main">
          <div class ="titlex">
            <div class="kom">
            <p class="komtext">${renderText(data.type)}</p>
            </div>
            <div class="svg">
           <svg fill="red" width="60" height="60" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M936 120a12 12 0 1 1 12-12 12 12 0 0 1-12 12m0-22a10 10 0 1 0 10 10 10 10 0 0 0-10-10m4.706 14.706a.95.95 0 0 1-1.345 0l-3.376-3.376-3.376 3.376a.949.949 0 1 1-1.341-1.342l3.376-3.376-3.376-3.376a.949.949 0 1 1 1.341-1.342l3.376 3.376 3.376-3.376a.949.949 0 1 1 1.342 1.342l-3.376 3.376 3.376 3.376a.95.95 0 0 1 .003 1.342" transform="translate(-924 -96)" style="fill-rule:evenodd"/>
</svg>
            </div>
            <div>
              <div class="sum" style="color: red">${sortText(
                data.amount,
              )} UZS</div>
            </div>
          </div>
          <div>
            <p class="title">
            ${t('Foydalanuvchi')}
            </p>
            <p class="text">
              ${data?.dname}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Bekor qilingan to‘lov')}
            </p>
            <p class="textxx">
            ${sortText(data.amount)} UZS
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot sanasi')}
            </p>
            <p class="text">
          ${settingDate(data?.created_at)}

          ${data?.time?.slice(0, 5)}
            </p>
          </div>
          <div>
            <p class="title">
            ${t('Amaliyot ID raqami')}
            </p>
            <p class="text">
            ${data?.id}
            </p>
          </div>
        </div>
      </body>
      </html>`;
  }
};
