$(function () {
  $('[data-toggle="popover"]').popover({
    html: true,
    content: function () {
      return '<img class="img-fluid" width="100px" src="'+$(this).data('img') + '" />';
    }
  })

  var floatingObjects = Array.prototype.slice.call(document.querySelectorAll('.floating-object'))

  function reactToFloatingObject(target) {
    var burstX = Math.round(Math.random() * 90 - 45) + 'px'
    var burstY = Math.round(Math.random() * 70 - 35) + 'px'

    window.clearTimeout(target._floatingTimer)
    target.classList.remove('is-reacting')
    target.style.setProperty('--burst-x', '0px')
    target.style.setProperty('--burst-y', '0px')

    window.requestAnimationFrame(function () {
      target.style.setProperty('--burst-x', burstX)
      target.style.setProperty('--burst-y', burstY)
      target.classList.add('is-reacting')

      target._floatingTimer = window.setTimeout(function () {
        target.style.setProperty('--burst-x', '0px')
        target.style.setProperty('--burst-y', '0px')
        target.classList.remove('is-reacting')
      }, 850)
    })
  }

  if (floatingObjects.length) {
    document.addEventListener('click', function (event) {
      var clickedObject = floatingObjects.find(function (object) {
        var rect = object.getBoundingClientRect()

        return event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
      })

      if (clickedObject) {
        reactToFloatingObject(clickedObject)
      }
    })
  }
})
