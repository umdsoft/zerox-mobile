'use strict';

/* Generated from Java with JSweet 3.0.0 - http://www.jsweet.org */
var uz;
(function (uz) {
  var yt;
  (function (yt) {
    var sample;
    (function (sample) {
      var myapplication;
      (function (myapplication) {
        /**
         * ���������������������� ����������������������
         * @class
         */
        var GOST28147Engine = /** @class */ (function () {
          function GOST28147Engine() {
            this.workingKey = null;
            if (this.forEncryption === undefined) {
              this.forEncryption = false;
            }
            this.S = GOST28147Engine.Sbox_Default_$LI$();
          }
          GOST28147Engine.__static_initialize = function () {
            if (!GOST28147Engine.__static_initialized) {
              GOST28147Engine.__static_initialized = true;
              GOST28147Engine.__static_initializer_0();
            }
          };
          GOST28147Engine.Sbox_Default_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.Sbox_Default == null) {
              GOST28147Engine.Sbox_Default = [
                4, 10, 9, 2, 13, 8, 0, 14, 6, 11, 1, 12, 7, 15, 5, 3, 14, 11, 4,
                12, 6, 13, 15, 10, 2, 3, 8, 1, 0, 7, 5, 9, 5, 8, 1, 13, 10, 3,
                4, 2, 14, 15, 12, 7, 6, 0, 9, 11, 7, 13, 10, 1, 0, 8, 9, 15, 14,
                4, 6, 12, 11, 2, 5, 3, 6, 12, 7, 1, 5, 15, 13, 8, 4, 10, 9, 14,
                0, 3, 11, 2, 4, 11, 10, 0, 7, 2, 1, 13, 3, 6, 8, 5, 9, 12, 15,
                14, 13, 11, 4, 1, 3, 15, 5, 9, 0, 10, 14, 7, 6, 8, 2, 12, 1, 15,
                13, 0, 5, 7, 10, 4, 9, 2, 3, 14, 6, 11, 8, 12,
              ];
            }
            return GOST28147Engine.Sbox_Default;
          };
          GOST28147Engine.ESbox_Test_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.ESbox_Test == null) {
              GOST28147Engine.ESbox_Test = [
                4, 2, 15, 5, 9, 1, 0, 8, 14, 3, 11, 12, 13, 7, 10, 6, 12, 9, 15,
                14, 8, 1, 3, 10, 2, 7, 4, 13, 6, 0, 11, 5, 13, 8, 14, 12, 7, 3,
                9, 10, 1, 5, 2, 4, 6, 15, 0, 11, 14, 9, 11, 2, 5, 15, 7, 1, 0,
                13, 12, 6, 10, 4, 3, 8, 3, 14, 5, 9, 6, 8, 0, 13, 10, 11, 7, 12,
                2, 1, 15, 4, 8, 15, 6, 11, 1, 9, 12, 5, 13, 3, 7, 10, 0, 14, 2,
                4, 9, 11, 12, 0, 3, 6, 7, 5, 4, 8, 14, 15, 1, 10, 2, 13, 12, 6,
                5, 2, 11, 0, 9, 13, 3, 14, 7, 10, 15, 4, 1, 8,
              ];
            }
            return GOST28147Engine.ESbox_Test;
          };
          GOST28147Engine.ESbox_A_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.ESbox_A == null) {
              GOST28147Engine.ESbox_A = [
                9, 6, 3, 2, 8, 11, 1, 7, 10, 4, 14, 15, 12, 0, 13, 5, 3, 7, 14,
                9, 8, 10, 15, 0, 5, 2, 6, 12, 11, 4, 13, 1, 14, 4, 6, 2, 11, 3,
                13, 8, 12, 15, 5, 10, 0, 7, 1, 9, 14, 7, 10, 12, 13, 1, 3, 9, 0,
                2, 11, 4, 15, 8, 5, 6, 11, 5, 1, 9, 8, 13, 15, 0, 14, 4, 2, 3,
                12, 7, 10, 6, 3, 10, 13, 12, 1, 2, 0, 11, 7, 5, 9, 4, 8, 15, 14,
                6, 1, 13, 2, 9, 7, 10, 6, 0, 8, 12, 4, 5, 15, 3, 11, 14, 11, 10,
                15, 5, 0, 12, 14, 8, 6, 2, 3, 9, 1, 7, 13, 4,
              ];
            }
            return GOST28147Engine.ESbox_A;
          };
          GOST28147Engine.ESbox_B_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.ESbox_B == null) {
              GOST28147Engine.ESbox_B = [
                8, 4, 11, 1, 3, 5, 0, 9, 2, 14, 10, 12, 13, 6, 7, 15, 0, 1, 2,
                10, 4, 13, 5, 12, 9, 7, 3, 15, 11, 8, 6, 14, 14, 12, 0, 10, 9,
                2, 13, 11, 7, 5, 8, 15, 3, 6, 1, 4, 7, 5, 0, 13, 11, 6, 1, 2, 3,
                10, 12, 15, 4, 14, 9, 8, 2, 7, 12, 15, 9, 5, 10, 11, 1, 4, 0,
                13, 6, 8, 14, 3, 8, 3, 2, 6, 4, 13, 14, 11, 12, 1, 7, 15, 10, 0,
                9, 5, 5, 2, 10, 11, 9, 1, 12, 3, 7, 4, 13, 0, 6, 15, 8, 14, 0,
                4, 11, 14, 8, 3, 7, 1, 10, 2, 9, 6, 15, 13, 5, 12,
              ];
            }
            return GOST28147Engine.ESbox_B;
          };
          GOST28147Engine.ESbox_C_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.ESbox_C == null) {
              GOST28147Engine.ESbox_C = [
                1, 11, 12, 2, 9, 13, 0, 15, 4, 5, 8, 14, 10, 7, 6, 3, 0, 1, 7,
                13, 11, 4, 5, 2, 8, 14, 15, 12, 9, 10, 6, 3, 8, 2, 5, 0, 4, 9,
                15, 10, 3, 7, 12, 13, 6, 14, 1, 11, 3, 6, 0, 1, 5, 13, 10, 8,
                11, 2, 9, 7, 14, 15, 12, 4, 8, 13, 11, 0, 4, 5, 1, 2, 9, 3, 12,
                14, 6, 15, 10, 7, 12, 9, 11, 1, 8, 14, 2, 4, 7, 3, 6, 5, 10, 0,
                15, 13, 10, 9, 6, 8, 13, 14, 2, 0, 15, 3, 5, 11, 4, 1, 12, 7, 7,
                4, 0, 5, 10, 2, 15, 14, 12, 6, 1, 11, 13, 9, 3, 8,
              ];
            }
            return GOST28147Engine.ESbox_C;
          };
          GOST28147Engine.ESbox_D_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.ESbox_D == null) {
              GOST28147Engine.ESbox_D = [
                15, 12, 2, 10, 6, 4, 5, 0, 7, 9, 14, 13, 1, 11, 8, 3, 11, 6, 3,
                4, 12, 15, 14, 2, 7, 13, 8, 0, 5, 10, 9, 1, 1, 12, 11, 0, 15,
                14, 6, 5, 10, 13, 4, 8, 9, 3, 7, 2, 1, 5, 14, 12, 10, 7, 0, 13,
                6, 2, 11, 4, 9, 3, 15, 8, 0, 12, 8, 9, 13, 2, 10, 11, 7, 3, 6,
                5, 4, 14, 15, 1, 8, 0, 15, 3, 2, 5, 14, 11, 1, 10, 4, 7, 12, 9,
                13, 6, 3, 0, 6, 15, 1, 14, 9, 2, 13, 8, 12, 4, 11, 10, 5, 7, 1,
                10, 6, 8, 15, 11, 0, 4, 12, 3, 5, 9, 7, 13, 2, 14,
              ];
            }
            return GOST28147Engine.ESbox_D;
          };
          GOST28147Engine.DSbox_Test_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.DSbox_Test == null) {
              GOST28147Engine.DSbox_Test = [
                4, 10, 9, 2, 13, 8, 0, 14, 6, 11, 1, 12, 7, 15, 5, 3, 14, 11, 4,
                12, 6, 13, 15, 10, 2, 3, 8, 1, 0, 7, 5, 9, 5, 8, 1, 13, 10, 3,
                4, 2, 14, 15, 12, 7, 6, 0, 9, 11, 7, 13, 10, 1, 0, 8, 9, 15, 14,
                4, 6, 12, 11, 2, 5, 3, 6, 12, 7, 1, 5, 15, 13, 8, 4, 10, 9, 14,
                0, 3, 11, 2, 4, 11, 10, 0, 7, 2, 1, 13, 3, 6, 8, 5, 9, 12, 15,
                14, 13, 11, 4, 1, 3, 15, 5, 9, 0, 10, 14, 7, 6, 8, 2, 12, 1, 15,
                13, 0, 5, 7, 10, 4, 9, 2, 3, 14, 6, 11, 8, 12,
              ];
            }
            return GOST28147Engine.DSbox_Test;
          };
          GOST28147Engine.DSbox_A_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.DSbox_A == null) {
              GOST28147Engine.DSbox_A = [
                10, 4, 5, 6, 8, 1, 3, 7, 13, 12, 14, 0, 9, 2, 11, 15, 5, 15, 4,
                0, 2, 13, 11, 9, 1, 7, 6, 3, 12, 14, 10, 8, 7, 15, 12, 14, 9, 4,
                1, 0, 3, 11, 5, 2, 6, 10, 8, 13, 4, 10, 7, 12, 0, 15, 2, 8, 14,
                1, 6, 5, 13, 11, 9, 3, 7, 6, 4, 11, 9, 12, 2, 10, 1, 8, 0, 14,
                15, 13, 3, 5, 7, 6, 2, 4, 13, 9, 15, 0, 10, 1, 5, 11, 8, 14, 12,
                3, 13, 14, 4, 1, 7, 0, 5, 10, 3, 12, 8, 15, 6, 2, 9, 11, 1, 3,
                10, 9, 5, 11, 4, 15, 8, 6, 7, 14, 13, 0, 2, 12,
              ];
            }
            return GOST28147Engine.DSbox_A;
          };
          GOST28147Engine.sBoxes_$LI$ = function () {
            GOST28147Engine.__static_initialize();
            if (GOST28147Engine.sBoxes == null) {
              GOST28147Engine.sBoxes = {};
            }
            return GOST28147Engine.sBoxes;
          };
          GOST28147Engine.__static_initializer_0 = function () {
            GOST28147Engine.addSBox(
              'Default',
              GOST28147Engine.Sbox_Default_$LI$(),
            );
            GOST28147Engine.addSBox(
              'E-TEST',
              GOST28147Engine.ESbox_Test_$LI$(),
            );
            GOST28147Engine.addSBox('E-A', GOST28147Engine.ESbox_A_$LI$());
            GOST28147Engine.addSBox('E-B', GOST28147Engine.ESbox_B_$LI$());
            GOST28147Engine.addSBox('E-C', GOST28147Engine.ESbox_C_$LI$());
            GOST28147Engine.addSBox('E-D', GOST28147Engine.ESbox_D_$LI$());
            GOST28147Engine.addSBox(
              'D-TEST',
              GOST28147Engine.DSbox_Test_$LI$(),
            );
            GOST28147Engine.addSBox('D-A', GOST28147Engine.DSbox_A_$LI$());
          };
          /*private*/
          GOST28147Engine.addSBox = function (sBoxName, sBox) {
            /* put */ (function (m, k, v) {
              if (m.entries == null) {
                m.entries = [];
              }
              for (var i = 0; i < m.entries.length; i++) {
                if (
                  (m.entries[i].key == null && k == null) ||
                  (m.entries[i].key.equals != null &&
                    m.entries[i].key.equals(k)) ||
                  m.entries[i].key === k
                ) {
                  m.entries[i].value = v;
                  return;
                }
              }
              m.entries.push({
                key: k,
                value: v,
                getKey: function () {
                  return this.key;
                },
                getValue: function () {
                  return this.value;
                },
              });
            })(GOST28147Engine.sBoxes_$LI$(), sBoxName.toUpperCase(), sBox);
          };
          /**
           * ���������������������������� �������� �������� 28147-89.
           *
           * @param {boolean} forEncryption �������� ���������� true ���� ������������������������ ������ ��������������������, ���������� ������ ������������������������.
           * @param params        ���������������� ����������.
           * @throws IllegalArgumentException ������������������ ������ ���������������������������������� ��������������������
           * @param {byte[]} sBox
           */
          GOST28147Engine.prototype.initSbox = function (forEncryption, sBox) {
            if (sBox.length !== GOST28147Engine.Sbox_Default_$LI$().length) {
              throw Object.defineProperty(
                new Error('invalid S-box passed to GOST28147 init'),
                '__classes',
                {
                  configurable: true,
                  value: [
                    'java.lang.Throwable',
                    'java.lang.Object',
                    'java.lang.RuntimeException',
                    'java.lang.IllegalArgumentException',
                    'java.lang.Exception',
                  ],
                },
              );
            }
            this.S = (function (s) {
              var a = [];
              while (s-- > 0) {
                a.push(0);
              }
              return a;
            })(sBox.length);
            /* arraycopy */
            (function (srcPts, srcOff, dstPts, dstOff, size) {
              if (srcPts !== dstPts || dstOff >= srcOff + size) {
                while (--size >= 0) {
                  dstPts[dstOff++] = srcPts[srcOff++];
                }
              } else {
                var tmp = srcPts.slice(srcOff, srcOff + size);
                for (var i = 0; i < size; i++) {
                  dstPts[dstOff++] = tmp[i];
                }
              }
            })(sBox, 0, this.S, 0, sBox.length);
          };
          GOST28147Engine.prototype.initKey = function (forEncryption, key) {
            this.workingKey = this.generateWorkingKey(forEncryption, key);
          };
          /**
           * �������������������� ������������������������ ������������������
           *
           * @return {string} ������������������������ ������������������
           */
          GOST28147Engine.prototype.getAlgorithmName = function () {
            return 'GOST28147';
          };
          /**
           * �������������������� ������������ ����������
           *
           * @return {number} ������������ ���������� �� ������������
           */
          GOST28147Engine.prototype.getBlockSize = function () {
            return GOST28147Engine.BLOCK_SIZE;
          };
          /**
           * ���������������������� �������� ������������
           *
           * @param {byte[]} in     ������������ ������������
           * @param {number} inOff  ������������������ �������������� �� �������������� ������������
           * @param {byte[]} out    ������������ ���� ������������ �������������������� ����������������������������
           * @param {number} outOff ������������������ �������������� ���� ������������ �������������������� ����������������������������
           * @return {number} �������������������� ������������������������������ ��������
           */
          GOST28147Engine.prototype.processBlock = function (
            __in,
            inOff,
            out,
            outOff,
          ) {
            if (this.workingKey == null) {
              throw Object.defineProperty(
                new Error('GOST28147 engine not initialised'),
                '__classes',
                {
                  configurable: true,
                  value: [
                    'java.lang.Throwable',
                    'java.lang.IllegalStateException',
                    'java.lang.Object',
                    'java.lang.RuntimeException',
                    'java.lang.Exception',
                  ],
                },
              );
            }
            if (inOff + GOST28147Engine.BLOCK_SIZE > __in.length) {
              throw Object.defineProperty(
                new Error('input buffer too short'),
                '__classes',
                {
                  configurable: true,
                  value: [
                    'java.lang.Throwable',
                    'java.lang.Object',
                    'java.lang.Exception',
                  ],
                },
              );
            }
            if (outOff + GOST28147Engine.BLOCK_SIZE > out.length) {
              throw Object.defineProperty(
                new Error('output buffer too short'),
                '__classes',
                {
                  configurable: true,
                  value: [
                    'java.lang.Throwable',
                    'java.lang.Object',
                    'java.lang.Exception',
                  ],
                },
              );
            }
            this.GOST28147Func(this.workingKey, __in, inOff, out, outOff);
            return GOST28147Engine.BLOCK_SIZE;
          };
          GOST28147Engine.prototype.reset = function () {};
          /*private*/
          GOST28147Engine.prototype.generateWorkingKey = function (
            forEncryption,
            userKey,
          ) {
            this.forEncryption = forEncryption;
            if (userKey.length !== 32) {
              throw Object.defineProperty(
                new Error(
                  'Key length invalid. Key needs to be 32 byte - 256 bit!!!',
                ),
                '__classes',
                {
                  configurable: true,
                  value: [
                    'java.lang.Throwable',
                    'java.lang.Object',
                    'java.lang.RuntimeException',
                    'java.lang.IllegalArgumentException',
                    'java.lang.Exception',
                  ],
                },
              );
            }
            var key = [0, 0, 0, 0, 0, 0, 0, 0];
            for (var i = 0; i !== 8; i++) {
              {
                key[i] = this.bytesToint(userKey, i * 4);
              }
            }
            return key;
          };
          /*private*/
          GOST28147Engine.prototype.GOST28147_mainStep = function (n1, key) {
            var cm = key + n1;
            var om = this.S[0 + ((cm >> (0 * 4)) & 15)] << (0 * 4);
            om += this.S[16 + ((cm >> (1 * 4)) & 15)] << (1 * 4);
            om += this.S[32 + ((cm >> (2 * 4)) & 15)] << (2 * 4);
            om += this.S[48 + ((cm >> (3 * 4)) & 15)] << (3 * 4);
            om += this.S[64 + ((cm >> (4 * 4)) & 15)] << (4 * 4);
            om += this.S[80 + ((cm >> (5 * 4)) & 15)] << (5 * 4);
            om += this.S[96 + ((cm >> (6 * 4)) & 15)] << (6 * 4);
            om += this.S[112 + ((cm >> (7 * 4)) & 15)] << (7 * 4);
            return (om << 11) | (om >>> (32 - 11));
          };
          /*private*/
          GOST28147Engine.prototype.GOST28147Func = function (
            workingKey,
            __in,
            inOff,
            out,
            outOff,
          ) {
            var N1;
            var N2;
            var tmp;
            N1 = this.bytesToint(__in, inOff);
            N2 = this.bytesToint(__in, inOff + 4);
            if (this.forEncryption) {
              for (var k = 0; k < 3; k++) {
                {
                  for (var j = 0; j < 8; j++) {
                    {
                      tmp = N1;
                      N1 = N2 ^ this.GOST28147_mainStep(N1, workingKey[j]);
                      N2 = tmp;
                    }
                  }
                }
              }
              for (var j = 7; j > 0; j--) {
                {
                  tmp = N1;
                  N1 = N2 ^ this.GOST28147_mainStep(N1, workingKey[j]);
                  N2 = tmp;
                }
              }
            } else {
              for (var j = 0; j < 8; j++) {
                {
                  tmp = N1;
                  N1 = N2 ^ this.GOST28147_mainStep(N1, workingKey[j]);
                  N2 = tmp;
                }
              }
              for (var k = 0; k < 3; k++) {
                {
                  for (var j = 7; j >= 0; j--) {
                    {
                      if (k === 2 && j === 0) {
                        break;
                      }
                      tmp = N1;
                      N1 = N2 ^ this.GOST28147_mainStep(N1, workingKey[j]);
                      N2 = tmp;
                    }
                  }
                }
              }
            }
            N2 = N2 ^ this.GOST28147_mainStep(N1, workingKey[0]);
            this.intTobytes(N1, out, outOff);
            this.intTobytes(N2, out, outOff + 4);
          };
          /*private*/
          GOST28147Engine.prototype.bytesToint = function (__in, inOff) {
            return (
              ((__in[inOff + 3] << 24) & -16777216) +
              ((__in[inOff + 2] << 16) & 16711680) +
              ((__in[inOff + 1] << 8) & 65280) +
              (__in[inOff] & 255)
            );
          };
          /*private*/
          GOST28147Engine.prototype.intTobytes = function (num, out, outOff) {
            out[outOff + 3] = (num >>> 24) | 0;
            out[outOff + 2] = (num >>> 16) | 0;
            out[outOff + 1] = (num >>> 8) | 0;
            out[outOff] = num | 0;
          };
          /**
           * �������������������� S-Box ���������������������������� �� SBoxName
           *
           * @param {string} sBoxName ���������������� S-Box
           * @return {byte[]} ������������ ������������ ���������������� S-Box
           */
          GOST28147Engine.getSBox = function (sBoxName) {
            var sBox = (function (m, k) {
              if (m.entries == null) {
                m.entries = [];
              }
              for (var i = 0; i < m.entries.length; i++) {
                if (
                  (m.entries[i].key == null && k == null) ||
                  (m.entries[i].key.equals != null &&
                    m.entries[i].key.equals(k)) ||
                  m.entries[i].key === k
                ) {
                  return m.entries[i].value;
                }
              }
              return null;
            })(GOST28147Engine.sBoxes_$LI$(), sBoxName.toUpperCase());
            if (sBox == null) {
              throw Object.defineProperty(
                new Error(
                  'Unknown S-Box - possible types: "Default", "E-Test", "E-A", "E-B", "E-C", "E-D", "D-Test", "D-A".',
                ),
                '__classes',
                {
                  configurable: true,
                  value: [
                    'java.lang.Throwable',
                    'java.lang.Object',
                    'java.lang.RuntimeException',
                    'java.lang.IllegalArgumentException',
                    'java.lang.Exception',
                  ],
                },
              );
            }
            var copy = (function (s) {
              var a = [];
              while (s-- > 0) {
                a.push(0);
              }
              return a;
            })(sBox.length);
            /* arraycopy */
            (function (srcPts, srcOff, dstPts, dstOff, size) {
              if (srcPts !== dstPts || dstOff >= srcOff + size) {
                while (--size >= 0) {
                  dstPts[dstOff++] = srcPts[srcOff++];
                }
              } else {
                var tmp = srcPts.slice(srcOff, srcOff + size);
                for (var i = 0; i < size; i++) {
                  dstPts[dstOff++] = tmp[i];
                }
              }
            })(sBox, 0, copy, 0, sBox.length);
            return copy;
          };
          GOST28147Engine.__static_initialized = false;
          GOST28147Engine.BLOCK_SIZE = 8;
          return GOST28147Engine;
        })();
        myapplication.GOST28147Engine = GOST28147Engine;
        GOST28147Engine.__class = 'uz.yt.sample.myapplication.GOST28147Engine';
      })((myapplication = sample.myapplication || (sample.myapplication = {})));
    })((sample = yt.sample || (yt.sample = {})));
  })((yt = uz.yt || (uz.yt = {})));
})(uz || (uz = {}));
uz.yt.sample.myapplication.GOST28147Engine.__static_initialize();
