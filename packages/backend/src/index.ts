// import 'global-agent/bootstrap';
// import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';

// setGlobalDispatcher(new EnvHttpProxyAgent());
// require('dotenv').config({ path: '../../.env' })
// require('dotenv').config();
// console.log("this is my env paht");
// console.log(require('dotenv').config())
import { createBackend } from '@backstage/backend-defaults';
import { createBackendModule } from '@backstage/backend-plugin-api';
import { githubAuthenticator } from '@backstage/plugin-auth-backend-module-github-provider';
import { gitlabAuthenticator } from '@backstage/plugin-auth-backend-module-gitlab-provider'
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';
import { stringifyEntityRef } from '@backstage/catalog-model'


const customAuth = createBackendModule({
  // This ID must be exactly "auth" because that's the plugin it targets
  pluginId: 'auth',
  // This ID must be unique, but can be anything
  moduleId: 'custom-auth-provider',
  register(reg) {
    reg.registerInit({
      deps: { providers: authProvidersExtensionPoint },
      async init({ providers }) {
        providers.registerProvider({
          // This ID must match the actual provider config, e.g. addressing
          // auth.providers.github means that this must be "github".
          providerId: 'github',
          // Use createProxyAuthProviderFactory instead if it's one of the proxy
          // based providers rather than an OAuth based one
          factory: createOAuthProviderFactory({
            authenticator: githubAuthenticator,
            async signInResolver(info, ctx) {
              /*********************************************************************
               * Custom resolver code goes here, see farther down in this article! *
               * "info" is the sign in result from the upstream (github here), and *
               * "ctx" contains useful utilities for token issuance etc.           *
               *********************************************************************/
              console.log('\n\n\n info ========\n\n\n');
              console.log(info);
              const { result: { fullProfile: {username} } } = info;

              // Profiles are not always guaranteed to to have an email address.
              // You can also find more provider-specific information in `info.result`.
              // It typically contains a `fullProfile` object as well as ID and/or access
              // tokens that you can use for additional lookups.
              if (!username) {
                throw new Error('User profile contained no email');
              }

              // You can add your own custom validation logic here.
              // Logins can be prevented by throwing an error like the one above.
              // myEmailValidator(email);

              // This example resolver simply uses the local part of the email as the name.
              // const [name] = email.split('@');

              // This helper function handles sign-in by looking up a user in the catalog.
              // The lookup can be done either by reference, annotations, or custom filters.
              //
              // The helper also issues a token for the user, using the standard group
              // membership logic to determine the ownership references of the user.
              //
              // There are a number of other methods on the ctx, feel free to explore them!

              const userEntity = stringifyEntityRef({
                kind: 'User',
                name: username,
                namespace: 'default',
              });

              return ctx.issueToken({
                claims: {
                  sub: userEntity,
                  ent: [userEntity],
                },
              });
            },
          }),
        });

        providers.registerProvider({
          providerId: 'gitlab', // GitLab provider ID
          factory: createOAuthProviderFactory({
            authenticator: gitlabAuthenticator,
            async signInResolver(info, ctx) {
              console.log('\n\n\n GitLab info ========\n\n\n');
              console.log(info);
              const { result: { fullProfile: { username } } } = info;

              if (!username) {
                throw new Error('User profile contained no username');
              }

              const userEntity = stringifyEntityRef({
                kind: 'User',
                name: username,
                namespace: 'default',
              });
              return ctx.issueToken({
                claims: {
                  sub: userEntity,
                  ent: [userEntity],
                },
              });
            }
          })
        })
      },
    });
  },
});


const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-gitlab'));
backend.add(import('@backstage/plugin-techdocs-backend'));


// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// See https://backstage.io/docs/features/software-catalog/configuration#subscribing-to-catalog-errors
backend.add(import('@backstage/plugin-catalog-backend-module-logs'));

// permission plugin
backend.add(import('@backstage/plugin-permission-backend'));
// See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
backend.add(
  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend'));

// search engine
// See https://backstage.io/docs/features/search/search-engines
backend.add(import('@backstage/plugin-search-backend-module-pg'));

// search collators
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));

// kubernetes
backend.add(import('@backstage/plugin-kubernetes-backend'));

// authentication --- disable github provider when setting up custom auth
// backend.add(import('@backstage/plugin-auth-backend-module-github-provider'));
backend.add(customAuth);

backend.start();
