function alertbox(msg='Default Text',type='success')
{
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": true,
        "progressBar": false,
        "positionClass": "toast-top-right",
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": 300,
        "hideDuration": 1000,
        "timeOut": 5000,
        "extendedTimeOut": 1000,
        "showEasing": "swing",
        "hideEasing": "swing",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
      }
    var $toast = toastr[type](msg);
}

function sweetalert(title,text,icon,locations) {
  Swal.fire(
    {
        title:title ,
        text: text,
        icon: icon,
        showCancelButton: false,
        confirmButtonColor: '#5664d2',
        cancelButtonColor: "#ff3d60"
    }
).then(function(){
  if (locations) {
    location.href = locations
  }
  else{
    location.reload()
  }
  
})
}