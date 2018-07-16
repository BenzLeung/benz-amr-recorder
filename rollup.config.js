import sourcemaps from "rollup-plugin-sourcemaps";
import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import cjs from "rollup-plugin-commonjs";
import replace from 'rollup-plugin-re';
import { uglify } from 'rollup-plugin-uglify';

export default [
    {
        input: './src/BenzAMRRecorder.js',
        plugins: [
            sourcemaps(),
            resolve({
                jsnext: true,
                browser: true
            }),
            babel({
                exclude: ['./node_modules/**', './src/amrnb.js']
            }),
            cjs(),
            // https://github.com/rollup/rollup/wiki/Troubleshooting#avoiding-eval
            replace({
                include: ['./src/amrnb.js'],
                replaces: {
                    'eval(': '[eval][0]('
                }
            })
        ],
        output: [
            {
                name: 'BenzAMRRecorder',
                file: './BenzAMRRecorder.js',
                format: 'umd',
                strict: false,
                sourcemap: true
            }
        ]
    },
    {
        input: './src/BenzAMRRecorder.js',
        plugins: [
            resolve({
                jsnext: true,
                browser: true
            }),
            babel({
                exclude: ['./node_modules/benz-recorderjs/**', './src/amrnb.js']
            }),
            cjs(),
            // https://github.com/rollup/rollup/wiki/Troubleshooting#avoiding-eval
            replace({
                include: ['./src/amrnb.js'],
                replaces: {
                    'eval(': '[eval][0]('
                }
            }),
            uglify({
                compress: {},
                mangle: {
                    properties: {
                        regex: /^_[^_]/
                    }
                },
                ie8: false,
                warnings: true
            })
        ],
        output: [
            {
                name: 'BenzAMRRecorder',
                file: './BenzAMRRecorder.min.js',
                format: 'umd',
                strict: false,
                sourcemap: false
            }
        ]
    }
]
