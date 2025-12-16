import { prisma } from '~~/prisma/prisma'
import {
  docArticleDetailSelect,
  mapDocArticleDetail
} from '~~/server/utils/doc/article'

export default defineEventHandler(async (event) => {
  const articleId = kunParseRouteId(event)
  if (!articleId) {
    return kunError(event, '文档 ID 不正确')
  }

  const article = await prisma.doc_article.findUnique({
    where: { id: articleId },
    select: docArticleDetailSelect
  })

  if (!article) {
    return kunError(event, '文档不存在')
  }

  const result: DocArticleDetail = mapDocArticleDetail(article)
  return result
})
