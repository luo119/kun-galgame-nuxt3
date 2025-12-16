<script setup lang="ts">
const route = useRoute()

const slugSegments = computed(() => (route.params.slug as string[]) || [])
const docSlug = computed(() => slugSegments.value.at(-1) || '')

const { images, isLightboxOpen, currentImageIndex, initializeLightbox } =
  useKunLightbox()

const candidateQuery = computed(() => ({
  page: 1,
  limit: 25,
  keyword: docSlug.value,
  orderBy: 'published_time',
  sortOrder: 'desc'
}))

const { data: candidateArticles } = await useFetch('/api/doc/article', {
  query: candidateQuery,
  watch: [docSlug],
  ...kungalgameResponseHandler
})

const articleSummary = computed(() => {
  const articles = candidateArticles.value?.articles || []
  return (
    articles.find((item) => item.path === route.path) ||
    articles.find((item) => item.slug === docSlug.value) ||
    null
  )
})

const articleDetail = ref<DocArticleDetail | null>(null)
const isArticleLoading = ref(false)

const fetchArticleDetail = async (articleId?: number | null) => {
  if (!articleId) {
    articleDetail.value = null
    return
  }
  isArticleLoading.value = true
  const data = await $fetch(`/api/doc/article/${articleId}`, {
    ...kungalgameResponseHandler
  })
  articleDetail.value = data
  isArticleLoading.value = false
}

watch(
  () => articleSummary.value?.id,
  (id) => {
    fetchArticleDetail(id ?? null)
  },
  { immediate: true }
)

watch(
  () => articleDetail.value?.contentMarkdown,
  async (value) => {
    if (!value) {
      return
    }
    await nextTick()
    initializeLightbox()
  }
)

useHead(() => {
  if (!articleDetail.value) {
    return {}
  }
  return {
    link: [
      {
        rel: 'canonical',
        href: `${kungal.domain.main}${articleDetail.value.path}`
      }
    ]
  }
})

watch(
  () => articleDetail.value,
  (value) => {
    if (!value) {
      useKunSeoMeta({
        title: '文档 | KUN Galgame',
        description: ''
      })
      return
    }
    useKunSeoMeta({
      title: `${value.title} | KUN Galgame`,
      description: value.description,
      ogImage: value.banner,
      ogType: 'article',
      articleAuthor: [`${kungal.domain.main}/user/${value.author.id}/info`],
      articlePublishedTime: value.publishedTime.toString(),
      articleModifiedTime: value.updated.toString()
    })
  },
  { immediate: true }
)
</script>

<template>
  <KunCard
    :is-hoverable="false"
    :is-transparent="false"
    class-name="backdrop-blur-none pb-6 min-h-[calc(100dvh-6rem)]"
  >
    <DocDetailBackgroundImage
      v-if="articleDetail"
      :src="articleDetail.banner"
    />

    <div class="flex">
      <DocDetailCategoryTree />

      <article class="flex-1 space-y-6 pl-0 lg:pr-67 xl:pl-67">
        <KunLightbox
          :images="images"
          v-model:is-open="isLightboxOpen"
          :initial-index="currentImageIndex"
        />

        <template v-if="articleDetail">
          <DocDetailHeader :metadata="articleDetail" />
          <section
            class="kun-prose bg-background rounded-2xl p-6 whitespace-pre-wrap shadow-sm"
          >
            {{ articleDetail.contentMarkdown }}
          </section>
          <DocDetailFooter />
        </template>

        <KunNull
          v-else-if="!isArticleLoading"
          description="没有找到该文档，或者它正在建设中"
        />
        <KunSkeleton v-else class="h-96 rounded-2xl" />
      </article>

      <div class="hidden lg:block">
        <div class="fixed -translate-x-67">
          <DocDetailTableOfContent :toc="null" />
        </div>
      </div>
    </div>
  </KunCard>
</template>
