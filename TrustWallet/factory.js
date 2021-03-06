var constructWallet = function(web3, wallet_info_obj) {
    var list_items = '<div class="list-group-item"> <h4 class="list-group-item-heading">Wallet Address</h4> <p class="list-group-item-text">' + wallet_info_obj.address + '</p></div>';
    list_items += '<div class="list-group-item"> <h4 class="list-group-item-heading">Time Created</h4> <p class="list-group-item-text">' +
        moment.unix(wallet_info_obj.time_created).format(date_format) + '</p></div>';
    list_items += '<div class="list-group-item"> <h4 class="list-group-item-heading">Balance</h4> <p class="list-group-item-text">' + web3.fromWei(wallet_info_obj.balance, "ether") + ' ETH</p></div>';
    var button = '<a href="wallet.html?wallet_address=' + wallet_info_obj.address + '" type="button" class="btn btn-primary">View Wallet</a>';
    return '<div class="panel panel-primary"> <div class="panel-body"> <div class="list-group">' + list_items + '</div>' + button + '</div> </div>';
}

var addWallet = function(index, trustWalletFactory, wallets, fn) {

    var wallet_info_obj = {};
    var wallet = null;

    var handleDateCreated = function(error, user_address) {
        // the input should be the first user address
        if (error) {
            alert(error);
        } else {
            wallet.users(user_address, function(error, user_info) {
                var user = constructUserObject(user_address, user_info);
                wallet_info_obj.time_created = user.time_added;
                wallets.push(wallet_info_obj);
                addWallet(index + 1, trustWalletFactory, wallets, fn)
            });
        }

    }

    var handleBalance = function(error, result) {
        if (error) {
            alert(error);
        } else {
            wallet_info_obj.balance = result;
            wallet.userAddresses(0, handleDateCreated);
        }
    }

    trustWalletFactory.wallets(web3.eth.accounts[0], index, function(error, wallet_address) {
        if (wallet_address == "0x") {
            fn(null, wallets);
        } else {
            getTrustWallet(web3, wallet_address, function(error, result) {
                if (error) {
                    alert(error);
                } else {
                    wallet_info_obj.address = wallet_address;
                    wallet = result;
                    web3.eth.getBalance(wallet.address, handleBalance);
                }
            });
        }
    });
}

var startApp = function(web3) {

    $("#btn_etherscan").click(function() {
        if (window.netId == 1) {
            window.location.href = "https://etherscan.io/address/0x903db1bf91cc22964cccfbe1a1875eb3b989f32a";
        } else if (window.netId == 3) {
            window.location.href = "https://ropsten.etherscan.io/address/0x8948075ce42e656a83f76b9a3d0b53e8dc5c7a66";
        } else {
            alert("You must be on Main Net or Ropsten.");
        }
    });

    web3.version.getNetwork(function(error, netId) {
        if (error) {
            alert(error);
        } else {
            window.netId = netId;
            getTrustWalletFactory(web3, function(error, trustWalletFactory) {
                if (error) {
                    alert(error);
                } else {
                    $("#btn_create_wallet").click(function() {
                        trustWalletFactory.createWallet(function(error, result) {
                            if (error) {
                                alert(error);
                            } else {
                                show_transaction_created(result);
                            }
                        });
                    });

                    var address_list = null;

                    var refresh = function() {

                        web3.version.getNetwork(function(error, netId) {
                            if (error) {
                                alert(error);
                            } else {
                                window.netId = netId;
                            }
                        });

                        var target_text = "Wallets created by your address (" + web3.eth.accounts[0] + ")";
                        if ($("#panel_wallets_title").text() != target_text) {
                            $("#panel_wallets_title").text(target_text);
                        }
                        addWallet(0, trustWalletFactory, [], function(error, result) {
                            if (address_list == null || result.length != address_list.length) {
                                address_list = result;
                                $("#panel_wallets").empty();
                                if (address_list.length == 0) {
                                    $("#panel_wallets").append("<h4>Looks like you did not create any wallets yet</h4><p>Start by creating a new wallet.</p>");
                                } else {
                                    for (var i = 0; i < address_list.length; i++) {
                                        $("#panel_wallets").append(constructWallet(web3, address_list[i]));
                                    }
                                }
                            }
                        });
                    }

                    refresh();
                    setInterval(refresh, 1000);
                }
            });
        }

    });
}

$(function() {

    function getWeb3(callback) {
        if (typeof window.web3 === 'undefined') {
            // no web3, use fallback
            alert("Please install MetaMask");
        } else {
            // window.web3 == web3 most of the time. Don't override the provided,
            // web3, just wrap it in your Web3.
            var myWeb3 = new Web3(window.web3.currentProvider);
            myWeb3.eth.defaultAccount = window.web3.eth.defaultAccount;
            callback(myWeb3);
        }
    }

    getWeb3(startApp);
});
