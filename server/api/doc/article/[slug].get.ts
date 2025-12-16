import { prisma } from '~~/prisma/prisma'
import {
  docArticleDetailSelect,
  mapDocArticleDetail
} from '~~/server/utils/doc/article'

export default defineEventHandler(async (event) => {
  const articleSlug = event.context.params?.slug
  if (!articleSlug) {
    return kunError(event, '文档 Slug 不正确')
  }

  const article = await prisma.doc_article.findUnique({
    where: { slug: articleSlug },
    select: docArticleDetailSelect
  })

  if (!article) {
    return kunError(event, '文档不存在')
  }

  const result: DocArticleDetail = await mapDocArticleDetail(article)
  return result
})
