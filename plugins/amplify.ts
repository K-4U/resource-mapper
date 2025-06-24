// plugins/amplify.js
import {Amplify} from 'aws-amplify'
import '@aws-amplify/ui-vue';
import outputs from "../amplify_outputs.json";

export default defineNuxtPlugin({
    name: 'amplify',
    parallel: true,
    async setup(nuxtApp){
        Amplify.configure(outputs)
    }
})
