'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schemaTypes} from './sanity/schemas'
import {structure} from './src/sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId: 'vvee2rx2', // Use this one since it has your API token
  dataset: 'production',
  schema: {
    types: schemaTypes,
  },
  plugins: [
    deskTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([...S.documentTypeListItems()])
    }),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool()
  ],
})
