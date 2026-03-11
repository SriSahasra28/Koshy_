var KiteConnect = require("kiteconnect").KiteConnect;

var kc = new KiteConnect({api_key: '3c2lfy32uu8ciru8'});


kc.generateSession("j9OMyR3Lfu3gpcnYQWPgw43kPC67WBZF", 'ctnw4fwncnqggxsxtbazum33zijlvyez')
    .then(function(response) {
        console.log(response);
        init();
    })
    .catch(function(err) {
        console.log(err);
    })

function init() {
    // Fetch equity margins.
    // You can have other api calls here.

    kc.getMargins()
        .then(function(response) {
            console.log(response);
        }).catch(function(err) {
            console.log(err);
        });
 }