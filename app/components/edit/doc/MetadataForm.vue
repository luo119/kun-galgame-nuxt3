<script setup lang="ts">
import { KUN_DOC_CATEGORY_MAP, KUN_DOC_STATUS_OPTIONS } from '~/constants/doc'
import { useDocEditorContext } from './context'
import { normalizeDocSlug } from '~/utils/doc'
import type { KunSelectOption } from '~/components/kun/select/type'

const { form, categories, tags, markPathCustomized, refreshTags } =
  useDocEditorContext()

const categoryOptions = computed<KunSelectOption[]>(() =>
  categories.value.map((category) => ({
    label:
      KUN_DOC_CATEGORY_MAP[category.slug] ||
      `${category.title} (${category.slug})`,
    value: category.id
  }))
)

const statusOptions = computed<KunSelectOption[]>(() =>
  KUN_DOC_STATUS_OPTIONS.map((option) => ({
    label: option.label,
    value: option.value
  }))
)

const isTagSelected = (tagId: number) => form.tagIds.includes(tagId)

const toggleTag = (tagId: number) => {
  if (isTagSelected(tagId)) {
    form.tagIds = form.tagIds.filter((id) => id !== tagId)
  } else {
    form.tagIds = Array.from(new Set([...form.tagIds, tagId]))
  }
}

const handlePathInput = () => {
  markPathCustomized()
}

const normalizeSlug = () => {
  form.slug = normalizeDocSlug(form.slug)
}

const newTagTitle = ref('')
const newTagSlug = ref('')
const newTagDescription = ref('')
const isCreatingTag = ref(false)
const isSlugEdited = ref(false)

watch(newTagTitle, (value) => {
  if (!isSlugEdited.value) {
    newTagSlug.value = normalizeDocSlug(value)
  }
})

const handleSlugInput = () => {
  isSlugEdited.value = true
  newTagSlug.value = normalizeDocSlug(newTagSlug.value)
}

const resetNewTagForm = () => {
  newTagTitle.value = ''
  newTagSlug.value = ''
  newTagDescription.value = ''
  isSlugEdited.value = false
}

const handleCreateTag = async () => {
  if (isCreatingTag.value) {
    return
  }

  const title = newTagTitle.value.trim()
  if (!title) {
    useMessage('Please enter a tag title', 'warn')
    return
  }

  const slug = normalizeDocSlug(newTagSlug.value || title)
  if (!slug) {
    useMessage('Please enter a valid tag slug', 'warn')
    return
  }

  isCreatingTag.value = true
  try {
    const created = await $fetch<DocTagItem>('/api/doc/tag', {
      method: 'POST',
      body: {
        slug,
        title,
        description: newTagDescription.value.trim()
      },
      ...kungalgameResponseHandler
    })

    if (created) {
      tags.value = [
        created,
        ...tags.value.filter((tag) => tag.id !== created.id)
      ]
      form.tagIds = Array.from(new Set([...form.tagIds, created.id]))
      useMessage('Tag created', 'success')
      resetNewTagForm()
      await refreshTags()
    }
  } finally {
    isCreatingTag.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold">Basic Metadata</h3>
      <p class="text-default-500 text-sm">
        Configure slug, path, banner, and description. Publish/update timestamps
        are managed automatically.
      </p>
    </div>

    <div class="space-y-4">
      <KunInput
        v-model="form.slug"
        label="Slug"
        placeholder="unique-doc-slug"
        maxlength="233"
        required
        @blur="normalizeSlug"
      />

      <KunInput
        v-model="form.path"
        label="Permalink"
        placeholder="/doc/awesome-article"
        maxlength="255"
        required
        @update:model-value="handlePathInput"
      />

      <KunInput
        v-model="form.banner"
        label="Banner URL"
        placeholder="https://example.com/banner.webp"
        maxlength="777"
      />

      <KunTextarea
        v-model="form.description"
        label="Summary"
        placeholder="Short introduction for this document"
        :rows="4"
        auto-grow
        :maxlength="777"
        required
        show-char-count
      />
    </div>

    <div class="space-y-4">
      <KunSelect
        v-model="form.categoryId"
        :options="categoryOptions"
        label="Category"
        placeholder="Select a category"
      />

      <KunSelect
        v-model="form.status"
        :options="statusOptions"
        label="Status"
        placeholder="Select a status"
      />

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <KunInput
          v-model="form.readingMinute"
          label="Estimated Reading (min)"
          type="number"
          min="0"
          readonly
          helper-text="Automatically calculated from content"
        />

        <div
          class="border-default-200 flex items-center justify-between rounded-lg border px-4 py-2"
        >
          <div>
            <p class="text-sm font-medium">Pinned</p>
            <p class="text-default-500 text-xs">
              Also display inside the homepage hero carousel
            </p>
          </div>
          <KunSwitch v-model="form.isPin" color="primary" />
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 class="font-semibold">Tags</h4>
          <p class="text-default-500 text-xs">
            Click any tag to toggle selection.
          </p>
        </div>
        <KunBadge color="secondary" variant="flat">
          {{ tags.length }} tags available
        </KunBadge>
      </div>

      <div
        class="scrollbar-hide border-default-200 max-h-64 overflow-y-auto rounded-lg border border-dashed p-3"
      >
        <div class="flex flex-wrap gap-2">
          <KunButton
            v-for="tag in tags"
            :key="tag.id"
            size="sm"
            rounded="full"
            :variant="isTagSelected(tag.id) ? 'solid' : 'light'"
            :color="isTagSelected(tag.id) ? 'primary' : 'default'"
            @click="toggleTag(tag.id)"
          >
            {{ tag.title }}
          </KunButton>
        </div>
      </div>

      <div
        class="text-default-500 grid grid-cols-1 gap-2 text-sm"
        v-if="form.tagIds.length"
      >
        <span>Selected tags:</span>
        <div class="flex flex-wrap gap-2">
          <KunBadge
            v-for="tagId in form.tagIds"
            :key="tagId"
            color="secondary"
            variant="flat"
          >
            {{ tags.find((tag) => tag.id === tagId)?.title || `#${tagId}` }}
          </KunBadge>
        </div>
      </div>

      <div class="border-default-200 space-y-3 rounded-lg border p-4">
        <div>
          <h5 class="text-sm font-semibold">Create Tag</h5>
          <p class="text-default-500 text-xs">
            Add new documentation tags without leaving this page.
          </p>
        </div>
        <KunInput
          v-model="newTagTitle"
          label="Title"
          placeholder="Tag title"
          maxlength="128"
          required
        />
        <KunInput
          v-model="newTagSlug"
          label="Slug"
          placeholder="tag-slug"
          maxlength="233"
          @input="handleSlugInput"
        />
        <KunTextarea
          v-model="newTagDescription"
          label="Description"
          placeholder="Optional note"
          :rows="2"
          :maxlength="255"
          auto-grow
        />
        <KunButton
          color="primary"
          :loading="isCreatingTag"
          :disabled="isCreatingTag"
          @click="handleCreateTag"
        >
          Create Tag
        </KunButton>
      </div>
    </div>
  </div>
</template>
