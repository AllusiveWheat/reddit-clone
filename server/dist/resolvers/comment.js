"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentResolver = void 0;
const type_graphql_1 = require("type-graphql");
const Comment_1 = require("../entities/Comment");
const isAuth_1 = require("../middleware/isAuth");
const typeorm_1 = require("typeorm");
const Updoot_1 = require("../entities/Updoot");
const User_1 = require("../entities/User");
let CommentInput = class CommentInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], CommentInput.prototype, "title", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], CommentInput.prototype, "text", void 0);
CommentInput = __decorate([
    type_graphql_1.InputType()
], CommentInput);
let PaginatedComments = class PaginatedComments {
};
__decorate([
    type_graphql_1.Field(() => [Comment_1.Comment]),
    __metadata("design:type", Array)
], PaginatedComments.prototype, "comments", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Boolean)
], PaginatedComments.prototype, "hasMore", void 0);
PaginatedComments = __decorate([
    type_graphql_1.ObjectType()
], PaginatedComments);
let CommentResolver = class CommentResolver {
    textSnippet(comment) {
        return comment.text.slice(0, 50);
    }
    creator(comment, { userLoader }) {
        return userLoader.load(comment.creatorId);
    }
    vote(commentId, value, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const isUpdoot = value !== -1;
            const realValue = isUpdoot ? 1 : -1;
            const { userId } = req.session;
            const updoot = yield Updoot_1.Updoot.findOne({
                where: { commentId, userId },
            });
            if (updoot && updoot.value !== realValue) {
                yield typeorm_1.getConnection().transaction((tm) => __awaiter(this, void 0, void 0, function* () {
                    yield tm.query(`
    update updoot
    set value = $1
    where "commentId" = $2 and "userId" = $3
        `, [realValue, commentId, userId]);
                    yield tm.query(`
          update comment
          set points = points + $1
          where id = $2
        `, [2 * realValue, commentId]);
                }));
            }
            else if (!updoot) {
                yield typeorm_1.getConnection().transaction((tm) => __awaiter(this, void 0, void 0, function* () {
                    yield tm.query(`
    insert into updoot ("userId", "commentId", value)
    values ($1, $2, $3)
        `, [userId, commentId, realValue]);
                    yield tm.query(`
    update comment
    set points = points + $1
    where id = $2
      `, [realValue, commentId]);
                }));
            }
            return true;
        });
    }
    createComment(input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            return Comment_1.Comment.create(Object.assign(Object.assign({}, input), { creatorId: req.session.userId })).save();
        });
    }
    comments(limit, cursor, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const realLimit = Math.min(25, limit);
            const reaLimitPlusOne = realLimit + 1;
            const replacements = [reaLimitPlusOne];
            if (cursor) {
                replacements.push(new Date(parseInt(cursor)));
            }
            const comments = yield typeorm_1.getConnection().query(`
    select p.*
    from comment p
    ${cursor ? `where p."createdAt" < $2` : ""}
    order by p."createdAt" DESC
    limit $1
    `, replacements);
            return {
                comments: comments.slice(0, realLimit),
                hasMore: comments.length === reaLimitPlusOne,
            };
        });
    }
    comment(id) {
        return Comment_1.Comment.findOne(id);
    }
    updateComment(id, title, text, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield typeorm_1.getConnection()
                .createQueryBuilder()
                .update(Comment_1.Comment)
                .set({ title, text })
                .where('id = :id and "creatorId" = :creatorId', {
                id,
                creatorId: req.session.userId,
            })
                .returning("*")
                .execute();
            return result.raw[0];
        });
    }
    deleteComment(id, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Comment_1.Comment.delete({ id, creatorId: req.session.userId });
            return true;
        });
    }
};
__decorate([
    type_graphql_1.FieldResolver(() => String),
    __param(0, type_graphql_1.Root()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Comment_1.Comment]),
    __metadata("design:returntype", void 0)
], CommentResolver.prototype, "textSnippet", null);
__decorate([
    type_graphql_1.FieldResolver(() => User_1.User),
    __param(0, type_graphql_1.Root()), __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Comment_1.Comment, Object]),
    __metadata("design:returntype", void 0)
], CommentResolver.prototype, "creator", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("commentId", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("value", () => type_graphql_1.Int)),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "vote", null);
__decorate([
    type_graphql_1.Mutation(() => Comment_1.Comment),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("input")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CommentInput, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "createComment", null);
__decorate([
    type_graphql_1.Query(() => PaginatedComments),
    __param(0, type_graphql_1.Arg("limit", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("cursor", () => String, { nullable: true })),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "comments", null);
__decorate([
    type_graphql_1.Query(() => Comment_1.Comment, { nullable: true }),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "comment", null);
__decorate([
    type_graphql_1.Mutation(() => Comment_1.Comment, { nullable: true }),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Arg("title")),
    __param(2, type_graphql_1.Arg("text")),
    __param(3, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "updateComment", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    type_graphql_1.UseMiddleware(isAuth_1.isAuth),
    __param(0, type_graphql_1.Arg("id", () => type_graphql_1.Int)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CommentResolver.prototype, "deleteComment", null);
CommentResolver = __decorate([
    type_graphql_1.Resolver(Comment_1.Comment)
], CommentResolver);
exports.CommentResolver = CommentResolver;
//# sourceMappingURL=comment.js.map