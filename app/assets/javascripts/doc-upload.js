// MOJ doc upload

import { MultiFileUpload } from '/public/javascripts/moj-frontend.min.js'

const $multiFileUpload = document.querySelector(
  '[data-module="moj-multi-file-upload"]'
)

new MultiFileUpload($multiFileUpload, {
  uploadUrl: '/ajax-upload',
  deleteUrl: '/ajax-delete'
})