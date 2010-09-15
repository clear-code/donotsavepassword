/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is "Do Not Save Password".
 *
 * The Initial Developer of the Original Code is ClearCode Inc.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): ClearCode Inc. <info@clear-code.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

function StartupService() { 
}
StartupService.prototype = {
	
	classDescription : 'DoNotSavePasswordStartupService', 
	contractID : '@clear-code.com/donotsavepassword/startup;1',
	classID : Components.ID('{57748650-c0a7-11df-851a-0800200c9a66}'),

	_xpcom_categories : [
		{ category : 'app-startup', service : true } // -Firefox 3.6
	],

	QueryInterface : XPCOMUtils.generateQI([
		Ci.nsIObserver
	]),

	get wrappedJSObject() {
		return this;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				if (!this.listeningProfileAfterChange) {
					ObserverService.addObserver(this, 'profile-after-change', false);
					this.listeningProfileAfterChange = true;
				}
				return;

			case 'profile-after-change':
				if (this.listeningProfileAfterChange) {
					ObserverService.removeObserver(this, 'profile-after-change');
					this.listeningProfileAfterChange = false;
				}
				if (Prefs.getBoolPref('extensions.donotsavepassword@clear-code.com.clearStoredPasswords'))
					this.clearStoredPasswords();
				return;
		}
	},
 
	clearStoredPasswords : function() 
	{
		var LoginManager = Cc['@mozilla.org/login-manager;1']
								.getService(Ci.nsILoginManager);
		var loginInfos;
		try {
			loginInfos = LoginManager.getAllLogins({});
		}
		catch(e) {
			return;
		}

		loginInfos.forEach(function(aLoginInfo) {
			LoginManager.removeLogin(aLoginInfo);
		}, this);
	}
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([StartupService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([StartupService]);
