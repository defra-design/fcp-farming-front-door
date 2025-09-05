//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Switching between read and unread
  const unreadMessages = document.querySelectorAll('#messageRead')
  unreadMessages.forEach(function (message) {
    message.addEventListener('click', function () {
      const list = message.classList
      if (!list.contains('govuk-details-message')) {
        message.classList.toggle('govuk-details-message')
        message.classList.toggle('govuk-details-message-unread')
      }
    })
  })

  // Dynamic styling of read/unread tag
  function updateUnreadMessagesCount() {
    const allMessagesSb = document.querySelector('.single-business')
    const allMessagesMb = document.querySelector('.multi-business')
    const allUnreadMessages = document.querySelectorAll(
      '.govuk-details-message-unread'
    )
    const allReadMessages = document.querySelectorAll('.govuk-details-message')
    const sbOverview = document.querySelector('#sb-unread')

    if (allMessagesSb) {
      allMessagesSb.innerHTML =
        allUnreadMessages.length === 0
          ? `All messages <span class="read-message">${allReadMessages.length} read</span>`
          : `All messages <span class="unread-message">${allUnreadMessages.length} unread</span>`
      sbOverview.innerHTML =
        allUnreadMessages.length === 0
          ? `<span class="read-message">${allReadMessages.length} read</span>`
          : `<span class="unread-message">${allUnreadMessages.length} unread</span>`
    } else if (allMessagesMb) {
      allMessagesMb.innerHTML = `All messages <span class="unread-message">${
        699 + allUnreadMessages.length
      } unread</span>`
    }
  }

  const messageDetails = document.querySelectorAll('.govuk-details')
  messageDetails.forEach(function (details) {
    details.addEventListener('click', function () {
      updateUnreadMessagesCount()
    })
  })

  // Permission toggle
  const radioContainer = document.querySelectorAll('.radio-container')
  const detailsComponents = document.querySelectorAll(
    '.permissions-column, .permissions-column-short, .permissions-column-xl'
  )

  radioContainer.forEach((container) => {
    container.addEventListener('change', () => {
      detailsComponents.forEach((column) => {
        const button = column.children[1].children[0]
        const columnTypeRegular =
          column.classList.contains('permissions-column')
        const parentClass = 'permission-select-selected'
        let columnClass
        if (button.checked) {
          if (column.classList.contains('permissions-column')) {
            columnClass = 'permissions-column-selected'
          } else if (column.classList.contains('permissions-column-short')) {
            columnClass = 'permissions-column-selected-short'
          } else if (column.classList.contains('permissions-column-xl')) {
            columnClass = 'permissions-column-selected-xl'
          }
          column.classList.add(columnClass)
          button.parentElement.classList.add(parentClass)
        } else {
          column.classList.remove('permissions-column-selected')
          column.classList.remove('permissions-column-selected-short')
          column.classList.remove('permissions-column-selected-xl')
          button.parentElement.classList.remove('permission-select-selected')
        }
      })
    })
  })

  // -----------------> messages section is no longer in use, if it's needed again, uncomment the code below <-----------------START

  // // Message history: checkbox filtering
  // const forAction = document.getElementById('messageFilter')
  // const forInformation = document.getElementById('messageFilter-2')
  // const actionMessages = document.querySelectorAll('.action')
  // const informationMessages = document.querySelectorAll('.information')

  // function filterMessages() {
  //   const displayAction = forAction.checked ? 'table-row' : 'none'
  //   const displayInformation = forInformation.checked ? 'table-row' : 'none'

  //   actionMessages.forEach((message) => {
  //     message.style.display = displayAction
  //   })

  //   informationMessages.forEach((message) => {
  //     message.style.display = displayInformation
  //   })

  //   if (!forAction.checked && !forInformation.checked) {
  //     actionMessages.forEach((message) => {
  //       message.style.display = 'table-row'
  //     })

  //     informationMessages.forEach((message) => {
  //       message.style.display = 'table-row'
  //     })
  //   }
  // }

  // forAction.addEventListener('change', filterMessages)
  // forInformation.addEventListener('change', filterMessages)

  // -----------------> messages section is no longer in use, if it's needed again, uncomment the code above <-----------------END

  // Card styling: apply styling to <h3> when hovering over <p>
  const pLinks = document.querySelectorAll('.p-link-style')

  pLinks.forEach(function (pLink) {
    const subHeading = pLink.previousElementSibling

    if (pLink && subHeading.tagName === 'H3') {
      pLink.addEventListener('mouseover', function () {
        subHeading.classList.toggle('govuk-link-hover')
      })

      pLink.addEventListener('mouseout', function () {
        subHeading.classList.remove('govuk-link-hover')
      })
    }
  })
})

// Permission text change on dropdown
function updateSummaryText(details) {
  const summary = details.querySelector(
    '.govuk-details__summary-text-permissions2'
  )
  if(summary){
    if (details.open) {
      summary.textContent = 'Hide permission level'
    } else {
      summary.textContent = 'View or change permission level'
    }
  }
}
document.querySelectorAll('.govuk-details').forEach((details) => {
  updateSummaryText(details)

  details.addEventListener('toggle', (event) => {
    updateSummaryText(details)
  })
})