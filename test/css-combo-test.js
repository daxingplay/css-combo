var EasyCombo = require('../lib/base').EasyCombo;

EasyCombo.build({
    base:'D:\\project\\tradeface\\assets\\4.0',
    debug: true,
    outputBase:'D:\\project\\tradeface\\assets\\testbuild',
    output:'tc/cart/cart.combine.css',
    includes:[
        'tc/cart/cart.css',
        'tc/cart/order.css',
        'tc/cart/item.css'
    ]
});
