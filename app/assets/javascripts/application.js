//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {

  // Switching between read and unread
    const unreadMessages = document.querySelectorAll('#messageRead');
    unreadMessages.forEach(function(message) {
      message.addEventListener('click', function() {
        const list = message.classList
        if (!list.contains('govuk-details-message')) {
          message.classList.toggle('govuk-details-message')
          message.classList.toggle('govuk-details-message-unread')
        }
      });
    });
    
    // Dynamic styling of read/unread tag
    function updateUnreadMessagesCount() {
      const allMessagesSb = document.querySelector('.single-business');
      const allMessagesMb = document.querySelector('.multi-business');
      const allUnreadMessages = document.querySelectorAll('.govuk-details-message-unread');
      const allReadMessages = document.querySelectorAll('.govuk-details-message');

      if (allMessagesSb) {
        allMessagesSb.innerHTML = allUnreadMessages.length === 0 ? `All messages <span class="read-message">${allReadMessages.length} read</span>` : `All messages <span class="unread-message">${allUnreadMessages.length} unread</span>`
      } else {
        allMessagesMb.innerHTML = `All messages <span class="unread-message">${699 + allUnreadMessages.length} unread</span>`
      }
    }

    updateUnreadMessagesCount();

    const messageDetails = document.querySelectorAll('.govuk-details');
    messageDetails.forEach(function(details) {
      details.addEventListener('click', function() {
        updateUnreadMessagesCount();
      });
    });
  })